<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Guest;

class GuestController extends Controller
{
    public function update(Request $request, Guest $guest)
    {

        $validated = $request->validate([
            'table_name' => 'nullable|string|max:255',
            'special_notes' => 'nullable|string',
        ]);

        $guest->update($validated);

        return back()->with('success', 'Invitado actualizado.');
    }
}
