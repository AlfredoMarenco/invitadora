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
    public function index(Request $request)
    {
        $wedding = Wedding::firstOrFail();
        $invitations = $wedding->invitations()->with('guests.table')->get();
        $tables = $wedding->tables()
            ->withCount('guests')
            ->with('guests:id,table_id,full_name,type,checkin_code')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/InvitationManager', [
            'wedding' => $wedding,
            'invitations' => $invitations,
            'tables' => $tables,
            'initialTab' => $request->query('tab', 'invitations'),
        ]);
    }

    public function store(Request $request)
    {
        $wedding = Wedding::firstOrFail();
        $validated = $request->validate([
            'name' => 'required|string',
            'phone' => 'nullable|string',
            'category' => 'nullable|string',
            'side' => 'required|in:groom,bride',
            'rsvp_deadline' => 'nullable|date',
            'guests' => 'required|array|min:1',
            'guests.*.full_name' => 'required|string',
            'guests.*.type' => 'required|in:adult,child',
            'guests.*.table_id' => 'nullable|integer|exists:wedding_tables,id',
        ]);

        DB::transaction(function () use ($validated, $wedding) {
            $invitation = $wedding->invitations()->create([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'category' => $validated['category'] ?? null,
                'side' => $validated['side'] ?? 'bride',
                'rsvp_deadline' => $validated['rsvp_deadline'] ?? null,
                'token' => Str::random(8),
            ]);

            foreach ($validated['guests'] as $gData) {
                $tableName = null;
                if (!empty($gData['table_id'])) {
                    $tbl = \App\Models\WeddingTable::find($gData['table_id']);
                    $tableName = $tbl ? $tbl->name : null;
                }
                $invitation->guests()->create([
                    'full_name' => $gData['full_name'],
                    'type' => $gData['type'],
                    'table_id' => $gData['table_id'] ?? null,
                    'table_name' => $tableName,
                ]);
            }
        });

        return back()->with('success', 'Invitación creada.');
    }

    public function update(Request $request, Invitation $invitation)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
            'side' => 'required|in:groom,bride',
            'rsvp_deadline' => 'nullable|date',
            'guests' => 'required|array|min:1',
            'guests.*.id' => 'nullable|integer',
            'guests.*.full_name' => 'required|string|max:255',
            'guests.*.type' => 'required|in:adult,child',
            'guests.*.table_id' => 'nullable|integer|exists:wedding_tables,id',
        ]);

        DB::transaction(function () use ($validated, $invitation) {
            $invitation->update([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'category' => $validated['category'] ?? null,
                'side' => $validated['side'] ?? 'bride',
                'rsvp_deadline' => $validated['rsvp_deadline'] ?? null,
            ]);

            $keptGuestIds = [];

            foreach ($validated['guests'] as $guestData) {
                $tableId = !empty($guestData['table_id']) ? $guestData['table_id'] : null;
                $tableName = null;
                if ($tableId) {
                    $tbl = \App\Models\WeddingTable::find($tableId);
                    $tableName = $tbl ? $tbl->name : null;
                }

                if (!empty($guestData['id'])) {
                    $guest = $invitation->guests()->where('id', $guestData['id'])->first();
                    if ($guest) {
                        $guest->update([
                            'full_name' => $guestData['full_name'],
                            'type' => $guestData['type'],
                            'table_id' => $tableId,
                            'table_name' => $tableName,
                        ]);
                        $keptGuestIds[] = $guest->id;
                    }
                } else {
                    $newGuest = $invitation->guests()->create([
                        'full_name' => $guestData['full_name'],
                        'type' => $guestData['type'],
                        'table_id' => $tableId,
                        'table_name' => $tableName,
                    ]);
                    $keptGuestIds[] = $newGuest->id;
                }
            }

            // Eliminar solo los integrantes que se retiraron y no tienen registro de ingreso
            $invitation->guests()
                ->whereNotIn('id', $keptGuestIds)
                ->where('has_entered', false)
                ->delete();
        });

        return back()->with('success', 'Invitación actualizada correctamente.');
    }

    public function destroy(Request $request, Invitation $invitation)
    {
        $hasCheckin = $invitation->guests()->where('has_entered', true)->exists();
        $hasRsvp = $invitation->status === 'responded' || $invitation->guests()->whereNotNull('is_attending')->exists();

        if ($hasCheckin || $hasRsvp) {
            $motivo = $hasCheckin 
                ? 'ya cuenta con registros de check-in / ingreso en la recepción.' 
                : 'sus integrantes ya confirmaron o respondieron su asistencia RSVP.';
            return back()->withErrors([
                'invitation' => "No se puede eliminar la invitación \"{$invitation->name}\" porque {$motivo} Puedes editarla en su lugar."
            ]);
        }

        $invitation->delete();
        return back()->with('success', 'Invitación eliminada.');
    }

    public function assignTable(Request $request, Invitation $invitation)
    {
        $validated = $request->validate([
            'table_id' => 'nullable|integer|exists:wedding_tables,id',
        ]);

        $tableId = $validated['table_id'] ?? null;
        $tableName = null;

        if ($tableId) {
            $table = \App\Models\WeddingTable::findOrFail($tableId);
            $tableName = $table->name;
            $guestCount = $invitation->guests()->count();
            $occupiedInTable = \App\Models\Guest::where('table_id', $tableId)
                ->where('invitation_id', '!=', $invitation->id)
                ->count();

            if (($occupiedInTable + $guestCount) > $table->capacity) {
                return back()->withErrors([
                    'table_id' => "La {$table->name} no tiene suficiente cupo ({$occupiedInTable}/{$table->capacity} ocupados, y la familia requiere {$guestCount} lugares).",
                ]);
            }
        }

        $invitation->guests()->update([
            'table_id' => $tableId,
            'table_name' => $tableName,
        ]);

        return back()->with('success', $tableName ? "Toda la familia fue asignada a {$tableName}." : 'Mesa desasignada de la familia.');
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
            fputcsv($file, ['Familia/Grupo', 'Telefono', 'Lado / Quien Invita', 'Categoria', 'Estado RSVP', 'Mensaje a Novios', 'Nombre Invitado', 'Tipo', 'Asiste', 'Mesa', 'Alergias/Restricciones', 'Notas Especiales']);
            
            foreach ($invitations as $inv) {
                foreach ($inv->guests as $guest) {
                    $asiste = $guest->is_attending === null ? 'Pendiente' : ($guest->is_attending ? 'Si' : 'No');
                    fputcsv($file, [
                        $inv->name,
                        $inv->phone,
                        $inv->side === 'groom' ? 'Invitados del Novio' : 'Invitados de la Novia',
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
