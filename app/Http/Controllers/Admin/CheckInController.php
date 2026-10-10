<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Guest;
use App\Models\Wedding;
use Inertia\Inertia;

class CheckInController extends Controller
{
    public function index()
    {
        $wedding = Wedding::firstOrFail();
        
        // Obtenemos solo los invitados que SI asisten o que están pendientes (por si llegan sin avisar).
        // Traemos su invitación y nombre de familia
        $guests = Guest::whereHas('invitation', function ($q) use ($wedding) {
                $q->where('wedding_id', $wedding->id);
            })
            ->where('is_attending', '!=', false) // excluir los que dijeron que NO asisten
            ->with('invitation:id,name,category')
            ->orderBy('full_name')
            ->get();

        return Inertia::render('Admin/CheckInManager', [
            'wedding' => $wedding,
            'guests' => $guests
        ]);
    }

    public function toggle(Request $request, Guest $guest)
    {
        $guest->update([
            'has_entered' => !$guest->has_entered
        ]);

        return back();
    }
}
