<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Guest;
use App\Models\WeddingTable;

class GuestController extends Controller
{
    public function update(Request $request, Guest $guest)
    {
        $validated = $request->validate([
            'table_id' => 'nullable|integer|exists:wedding_tables,id',
            'special_notes' => 'nullable|string|max:1000',
        ]);

        $tableId = $validated['table_id'] ?? null;

        if ($tableId) {
            $table = WeddingTable::findOrFail($tableId);

            // Check capacity limit
            $currentCount = Guest::where('table_id', $tableId)
                ->where('id', '!=', $guest->id)
                ->count();

            if ($currentCount >= $table->capacity) {
                return back()->withErrors([
                    'table_id' => "La {$table->name} ya está llena ({$currentCount}/{$table->capacity} lugares ocupados).",
                ]);
            }

            $guest->table_id = $table->id;
            $guest->table_name = $table->name;
        } else {
            $guest->table_id = null;
            $guest->table_name = null;
        }

        if ($request->has('special_notes')) {
            $guest->special_notes = $validated['special_notes'] ?? null;
        }
        $guest->save();

        return back()->with('success', 'Invitado actualizado correctamente.');
    }
}
