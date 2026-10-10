<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
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
        $invitation = Invitation::where('token', $token)->with('wedding')->firstOrFail();

        $deadline = $invitation->rsvp_deadline ?? $invitation->wedding->rsvp_deadline;
        if ($deadline && now()->startOfDay()->gt($deadline)) {
            abort(403, 'La fecha límite para confirmar ha expirado.');
        }

        $validated = $request->validate([
            'guests' => 'required|array',
            'guests.*.id' => 'required|exists:guests,id',
            'guests.*.is_attending' => 'required|boolean',
            'guests.*.allergies' => 'nullable|string|max:255',
            'message_to_couple' => 'nullable|string',
        ]);

        DB::transaction(function () use ($invitation, $validated) {
            foreach ($validated['guests'] as $guestData) {
                $invitation->guests()
                    ->where('id', $guestData['id'])
                    ->update([
                        'is_attending' => $guestData['is_attending'],
                        'allergies' => $guestData['allergies'] ?? null,
                    ]);
            }
            $invitation->update([
                'status' => 'responded',
                'message_to_couple' => $validated['message_to_couple'] ?? null,
            ]);
        });

        return back()->with('success', 'RSVP guardado correctamente.');
    }
}
