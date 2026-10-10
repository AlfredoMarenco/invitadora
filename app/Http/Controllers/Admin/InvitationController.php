<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wedding;
use App\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvitationController extends Controller
{
    public function index()
    {
        $wedding = Wedding::firstOrFail();
        $invitations = $wedding->invitations()->with('guests')->get();
        return Inertia::render('Admin/InvitationManager', [
            'wedding' => $wedding,
            'invitations' => $invitations
        ]);
    }

    public function store(Request $request)
    {

        $wedding = Wedding::firstOrFail();
        $validated = $request->validate([
            'name' => 'required|string',
            'phone' => 'nullable|string',
            'category' => 'nullable|string',
            'rsvp_deadline' => 'nullable|date',
            'guests' => 'required|array|min:1',
            'guests.*.full_name' => 'required|string',
            'guests.*.type' => 'required|in:adult,child',
        ]);

        DB::transaction(function () use ($validated, $wedding) {
            $invitation = $wedding->invitations()->create([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'category' => $validated['category'] ?? null,
                'rsvp_deadline' => $validated['rsvp_deadline'] ?? null,
                'token' => Str::random(8),
            ]);

            $invitation->guests()->createMany($validated['guests']);
        });

        return back()->with('success', 'Invitación creada.');
    }

    public function destroy(Request $request, Invitation $invitation)
    {

        $invitation->delete();
        return back()->with('success', 'Invitación eliminada.');
    }

    public function export(Request $request)
    {
        $wedding = Wedding::firstOrFail();
        $invitations = $wedding->invitations()->with('guests')->get();
        
        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=invitados.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];
        
        $callback = function() use($invitations) {
            $file = fopen('php://output', 'w');
            // BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($file, ['Familia/Grupo', 'Telefono', 'Categoria', 'Estado RSVP', 'Mensaje a Novios', 'Nombre Invitado', 'Tipo', 'Asiste', 'Mesa', 'Alergias/Restricciones', 'Notas Especiales']);
            
            foreach ($invitations as $inv) {
                foreach ($inv->guests as $guest) {
                    $asiste = $guest->is_attending === null ? 'Pendiente' : ($guest->is_attending ? 'Si' : 'No');
                    fputcsv($file, [
                        $inv->name,
                        $inv->phone,
                        $inv->category ?? 'Sin etiqueta',
                        $inv->status,
                        $inv->message_to_couple ?? '',
                        $guest->full_name,
                        $guest->type === 'child' ? 'Nino' : 'Adulto',
                        $asiste,
                        $guest->table_name ?? '',
                        $guest->allergies ?? '',
                        $guest->special_notes ?? ''
                    ]);
                }
            }
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
}
