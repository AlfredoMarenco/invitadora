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
            ->with('invitation:id,name,category,token')
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
        $guest->update([
            'has_entered' => !$guest->has_entered
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
                'has_entered' => $hasEntered
            ]);

        return back();
    }
}
