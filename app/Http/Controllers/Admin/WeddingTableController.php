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
            'pos_x' => 'nullable|numeric',
            'pos_y' => 'nullable|numeric',
            'shape' => 'nullable|string|in:round,rectangular,head',
            'rotation' => 'nullable|integer',
            'width' => 'nullable|integer|min:40|max:800',
            'height' => 'nullable|integer|min:40|max:800',
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
            'pos_x' => 'nullable|numeric',
            'pos_y' => 'nullable|numeric',
            'shape' => 'nullable|string|in:round,rectangular,head',
            'rotation' => 'nullable|integer',
            'width' => 'nullable|integer|min:40|max:800',
            'height' => 'nullable|integer|min:40|max:800',
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

    public function updatePosition(Request $request, WeddingTable $table)
    {
        $validated = $request->validate([
            'pos_x' => 'required|numeric',
            'pos_y' => 'required|numeric',
            'rotation' => 'nullable|integer',
            'shape' => 'nullable|string|in:round,rectangular,head',
            'width' => 'nullable|integer|min:40|max:800',
            'height' => 'nullable|integer|min:40|max:800',
        ]);

        $table->update($validated);

        return back()->with('success', 'Posición de mesa actualizada.');
    }

    public function batchPositions(Request $request)
    {
        $validated = $request->validate([
            'tables' => 'required|array',
            'tables.*.id' => 'required|exists:wedding_tables,id',
            'tables.*.pos_x' => 'required|numeric',
            'tables.*.pos_y' => 'required|numeric',
            'tables.*.rotation' => 'nullable|integer',
            'tables.*.shape' => 'nullable|string|in:round,rectangular,head',
            'tables.*.width' => 'nullable|integer|min:40|max:800',
            'tables.*.height' => 'nullable|integer|min:40|max:800',
        ]);

        foreach ($validated['tables'] as $tData) {
            $updateData = [
                'pos_x' => $tData['pos_x'],
                'pos_y' => $tData['pos_y'],
                'rotation' => $tData['rotation'] ?? 0,
                'shape' => $tData['shape'] ?? 'round',
            ];
            if (isset($tData['width'])) $updateData['width'] = $tData['width'];
            if (isset($tData['height'])) $updateData['height'] = $tData['height'];

            WeddingTable::where('id', $tData['id'])->update($updateData);
        }

        return back()->with('success', 'Distribución de mesas guardada correctamente.');
    }

    public function updateVenueElements(Request $request)
    {
        $validated = $request->validate([
            'elements' => 'present|array',
        ]);

        $wedding = Wedding::firstOrFail();
        $wedding->update([
            'venue_elements' => $validated['elements'],
        ]);

        return back()->with('success', 'Zonas y estructuras del salón guardadas correctamente.');
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
