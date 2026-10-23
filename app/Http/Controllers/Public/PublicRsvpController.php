<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Guest;
use App\Models\Wedding;
use App\Models\User;
use App\Notifications\GuestRsvpNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class PublicRsvpController extends Controller
{
    private const CLOSED_MESSAGE = 'La fecha límite para confirmar ha expirado.';

    public function show($token)
    {
        $invitation = Invitation::where('token', $token)
            ->with(['guests', 'wedding'])
            ->firstOrFail();

        if ($invitation->status === 'pending') {
            $invitation->update(['status' => 'viewed']);
        }

        return Inertia::render('Public/RsvpPage', [
            'invitation' => $invitation
        ]);
    }

    public function update(Request $request, $token)
    {
        $invitation = Invitation::where('token', $token)->with(['wedding', 'guests'])->firstOrFail();

        if ($invitation->isRsvpClosed()) {
            return back()->withErrors(['rsvp' => self::CLOSED_MESSAGE]);
        }

        DB::transaction(function () use ($invitation, $request) {
            if ($request->has('guests') && is_array($request->guests)) {
                foreach ($request->guests as $guestData) {
                    if (isset($guestData['id'])) {
                        $invitation->guests()
                            ->where('id', $guestData['id'])
                            ->update([
                                'is_attending' => filter_var($guestData['is_attending'], FILTER_VALIDATE_BOOLEAN),
                                'allergies' => $guestData['allergies'] ?? null,
                            ]);
                    }
                }
            } elseif ($request->has('is_attending')) {
                $isAttending = filter_var($request->is_attending, FILTER_VALIDATE_BOOLEAN);
                foreach ($invitation->guests as $guest) {
                    $guest->update([
                        'is_attending' => $isAttending,
                    ]);
                }
            }

            $message = $request->input('message_to_couple') ?? $request->input('message');
            $invitation->update([
                'status' => 'responded',
                'message_to_couple' => $message ?: $invitation->message_to_couple,
            ]);
        });

        $this->sendRsvpNotifications($invitation->fresh(['guests']), $invitation->wedding);

        return back()->with('success', '¡Confirmación guardada correctamente!');
    }

    public function submitGeneral(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'is_attending' => 'required',
            'message' => 'nullable|string',
        ]);

        $wedding = Wedding::firstOrFail();

        if ($wedding->isRsvpClosed()) {
            return back()->withErrors(['rsvp' => self::CLOSED_MESSAGE]);
        }

        $name = trim($request->input('name'));
        $isAttending = filter_var($request->input('is_attending'), FILTER_VALIDATE_BOOLEAN);
        $message = $request->input('message') ?? $request->input('message_to_couple');

        $closed = false;
        $targetInvitation = null;

        DB::transaction(function () use ($wedding, $name, $isAttending, $message, &$closed, &$targetInvitation) {
            // 1. Buscar si existe un invitado con nombre similar o exacto
            $guest = Guest::whereHas('invitation', function ($q) use ($wedding) {
                $q->where('wedding_id', $wedding->id);
            })->where('full_name', 'like', "%{$name}%")->first();

            if ($guest) {
                $invitation = $guest->invitation;
                if ($invitation->isRsvpClosed()) {
                    $closed = true;
                    return;
                }
                $guest->update(['is_attending' => $isAttending]);
                $invitation->update([
                    'status' => 'responded',
                    'message_to_couple' => $message ?: $invitation->message_to_couple,
                ]);
                $targetInvitation = $invitation;
                return;
            }

            // 2. Buscar si el nombre coincide con el nombre de la invitación / familia
            $invitation = Invitation::where('wedding_id', $wedding->id)
                ->where('name', 'like', "%{$name}%")
                ->first();

            if ($invitation) {
                if ($invitation->isRsvpClosed()) {
                    $closed = true;
                    return;
                }
                foreach ($invitation->guests as $g) {
                    $g->update(['is_attending' => $isAttending]);
                }
                $invitation->update([
                    'status' => 'responded',
                    'message_to_couple' => $message ?: $invitation->message_to_couple,
                ]);
                $targetInvitation = $invitation;
                return;
            }

            // 3. Si no existe, crear la invitación y su invitado para que quede registrada en el panel
            $newInvitation = Invitation::create([
                'wedding_id' => $wedding->id,
                'name' => $name,
                'token' => \Illuminate\Support\Str::random(10),
                'status' => 'responded',
                'message_to_couple' => $message,
            ]);

            Guest::create([
                'invitation_id' => $newInvitation->id,
                'full_name' => $name,
                'type' => 'adult',
                'is_attending' => $isAttending,
            ]);

            $targetInvitation = $newInvitation;
        });

        if ($closed) {
            return back()->withErrors(['rsvp' => self::CLOSED_MESSAGE]);
        }

        if ($targetInvitation) {
            $this->sendRsvpNotifications($targetInvitation->fresh(['guests']), $wedding);
        }

        return back()->with('success', '¡Confirmación recibida con éxito!');
    }

    /**
     * Enviar notificaciones por base de datos (panel admin) y correo brandeado a los novios.
     */
    private function sendRsvpNotifications(Invitation $invitation, Wedding $wedding): void
    {
        try {
            // Verificar si las notificaciones están activadas en la boda (por defecto sí)
            if ($wedding->notify_on_rsvp === false) {
                return;
            }

            // 1. Notificar en Base de Datos a los usuarios administradores (campana del panel)
            $adminUsers = User::all();
            if ($adminUsers->isNotEmpty()) {
                Notification::send($adminUsers, new GuestRsvpNotification($invitation, $wedding));
            }

            // 2. Notificar por Correo Electrónico Brandeado
            // Determinar los destinatarios: el correo configurado en la boda o los emails de los admins
            $emails = [];
            if (!empty($wedding->rsvp_notification_email)) {
                $rawList = preg_split('/[,;]+/', $wedding->rsvp_notification_email);
                foreach ($rawList as $mail) {
                    $clean = trim($mail);
                    if (filter_var($clean, FILTER_VALIDATE_EMAIL)) {
                        $emails[] = $clean;
                    }
                }
            }

            // Si no se configuró un correo especial, usar el correo de los administradores registrados
            if (empty($emails)) {
                $emails = $adminUsers->pluck('email')->filter()->all();
            }

            $emails = array_unique($emails);

            foreach ($emails as $email) {
                try {
                    Notification::route('mail', $email)
                        ->notify(new GuestRsvpNotification($invitation, $wedding));
                } catch (\Throwable $mailError) {
                    Log::warning("No se pudo enviar correo de confirmación a {$email}: " . $mailError->getMessage());
                }
            }
        } catch (\Throwable $e) {
            Log::error("Error general procesando notificaciones de RSVP: " . $e->getMessage());
        }
    }
}
