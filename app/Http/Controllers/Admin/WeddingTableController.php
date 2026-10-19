<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wedding;
use App\Models\WeddingTable;
use Illuminate\Http\Request;

class WeddingTableController extends Controller
{
    public function index()
    {
        return redirect()->route('admin.invitations.index', ['tab' => 'tables']);
    }

    public function store(Request $request)
    {
        $wedding = Wedding::firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $wedding->tables()->create($validated);

        return back()->with('success', 'Mesa creada correctamente.');
    }

    public function update(Request $request, WeddingTable $table)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $currentGuestsCount = $table->guests()->count();
        if ($validated['capacity'] < $currentGuestsCount) {
            return back()->withErrors([
                'capacity' => "La capacidad no puede ser menor a los invitados actualmente asignados ({$currentGuestsCount}).",
            ]);
        }

        $table->update($validated);

        // Synchronize table_name in assigned guests for backward compatibility
        $table->guests()->update(['table_name' => $table->name]);

        return back()->with('success', 'Mesa actualizada correctamente.');
    }

    public function destroy(WeddingTable $table)
    {
        // Unassign guests
        $table->guests()->update([
            'table_id' => null,
            'table_name' => null,
        ]);

        $table->delete();

        return back()->with('success', 'Mesa eliminada correctamente.');
    }
}
