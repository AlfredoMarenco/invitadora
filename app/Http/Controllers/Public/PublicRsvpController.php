<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Guest;
use App\Models\Wedding;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PublicRsvpController extends Controller
{
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

        $deadline = $invitation->rsvp_deadline ?? $invitation->wedding->rsvp_deadline;
        if ($deadline && now()->startOfDay()->gt($deadline)) {
            return back()->withErrors(['rsvp' => 'La fecha límite para confirmar ha expirado.']);
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
        $name = trim($request->input('name'));
        $isAttending = filter_var($request->input('is_attending'), FILTER_VALIDATE_BOOLEAN);
        $message = $request->input('message') ?? $request->input('message_to_couple');

        DB::transaction(function () use ($wedding, $name, $isAttending, $message) {
            // 1. Buscar si existe un invitado con nombre similar o exacto
            $guest = Guest::whereHas('invitation', function ($q) use ($wedding) {
                $q->where('wedding_id', $wedding->id);
            })->where('full_name', 'like', "%{$name}%")->first();

            if ($guest) {
                $invitation = $guest->invitation;
                $guest->update(['is_attending' => $isAttending]);
                $invitation->update([
                    'status' => 'responded',
                    'message_to_couple' => $message ?: $invitation->message_to_couple,
                ]);
                return;
            }

            // 2. Buscar si el nombre coincide con el nombre de la invitación / familia
            $invitation = Invitation::where('wedding_id', $wedding->id)
                ->where('name', 'like', "%{$name}%")
                ->first();

            if ($invitation) {
                foreach ($invitation->guests as $g) {
                    $g->update(['is_attending' => $isAttending]);
                }
                $invitation->update([
                    'status' => 'responded',
                    'message_to_couple' => $message ?: $invitation->message_to_couple,
                ]);
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
        });

        return back()->with('success', '¡Confirmación recibida con éxito!');
    }
}
