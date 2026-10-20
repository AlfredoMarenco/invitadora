<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Guest;
use App\Models\Invitation;
use App\Models\Wedding;
use Inertia\Inertia;

class CheckInController extends Controller
{
    public function index()
    {
        $wedding = Wedding::firstOrFail();
        
        // Traemos todas las invitaciones con sus invitados
        $invitations = $wedding->invitations()
            ->with(['guests' => function ($q) {
                $q->orderBy('full_name');
            }])
            ->orderBy('name')
            ->get();

        // Obtenemos solo los invitados que SI asisten o que están pendientes (por si llegan sin avisar).
        $guests = Guest::whereHas('invitation', function ($q) use ($wedding) {
                $q->where('wedding_id', $wedding->id);
            })
            ->where('is_attending', '!=', false) // excluir los que dijeron que NO asisten
            ->with('invitation:id,name,category,side,token')
            ->orderBy('full_name')
            ->get();

        return Inertia::render('Admin/CheckInManager', [
            'wedding' => $wedding,
            'guests' => $guests,
            'invitations' => $invitations,
        ]);
    }

    public function toggle(Request $request, Guest $guest)
    {
        $hasEntered = !$guest->has_entered;
        $guest->update([
            'has_entered' => $hasEntered,
            'checked_in_at' => $hasEntered ? now() : null,
        ]);

        return back();
    }

    public function toggleInvitation(Request $request, Invitation $invitation)
    {
        $hasEntered = $request->has('has_entered') 
            ? $request->boolean('has_entered') 
            : true;

        // Solo marcamos a los invitados que SÍ confirmaron asistencia
        $invitation->guests()
            ->where('is_attending', true)
            ->update([
                'has_entered' => $hasEntered,
                'checked_in_at' => $hasEntered ? now() : null,
            ]);

        return back();
    }

    public function scan(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $rawCode = trim($request->input('code'));

        // Extraer código si viene dentro de una URL completa (ej. ?code=AJ-XXXX o /scan?code=...)
        $code = $rawCode;
        if (str_contains($rawCode, 'code=')) {
            $parsed = parse_url($rawCode);
            if (isset($parsed['query'])) {
                parse_str($parsed['query'], $queryParams);
                if (!empty($queryParams['code'])) {
                    $code = trim($queryParams['code']);
                }
            }
        } elseif (str_starts_with($rawCode, 'GUEST:')) {
            $code = trim(substr($rawCode, 6));
        }

        $wedding = Wedding::firstOrFail();

        $guest = Guest::where('checkin_code', $code)
            ->whereHas('invitation', function ($q) use ($wedding) {
                $q->where('wedding_id', $wedding->id);
            })
            ->with('invitation')
            ->first();

        if (!$guest) {
            return response()->json([
                'status' => 'not_found',
                'message' => "Código de pase '{$code}' no encontrado o no pertenece a este evento.",
            ], 404);
        }

        // Si ya había ingresado
        if ($guest->has_entered) {
            $time = $guest->checked_in_at ? $guest->checked_in_at->timezone('America/Merida')->format('h:i A') : 'previamente';
            return response()->json([
                'status' => 'already_entered',
                'guest' => $guest,
                'invitation' => $guest->invitation,
                'message' => "El pase de {$guest->full_name} ya fue validado hoy a las {$time}.",
            ]);
        }

        // Si no está confirmado
        if ($guest->is_attending !== true) {
            return response()->json([
                'status' => 'not_confirmed',
                'guest' => $guest,
                'invitation' => $guest->invitation,
                'message' => "El invitado {$guest->full_name} no confirmó asistencia. Requiere autorización excepcional.",
            ]);
        }

        // Validación exitosa
        $guest->update([
            'has_entered' => true,
            'checked_in_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'guest' => $guest,
            'invitation' => $guest->invitation,
            'message' => "¡Acceso autorizado para {$guest->full_name}!",
        ]);
    }
}
