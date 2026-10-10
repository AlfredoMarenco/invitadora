<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wedding;

class DashboardController extends Controller
{
    public function index()
    {
        $wedding = Wedding::firstOrFail();
        $invitations = $wedding->invitations()->with('guests')->get();
        
        $totalGuests = 0;
        $confirmedGuests = 0;
        $rejectedGuests = 0;
        $pendingGuests = 0;

        foreach ($invitations as $invitation) {
            foreach ($invitation->guests as $guest) {
                $totalGuests++;
                if ($guest->is_attending === true) {
                    $confirmedGuests++;
                } elseif ($guest->is_attending === false) {
                    $rejectedGuests++;
                } else {
                    $pendingGuests++;
                }
            }
        }

        return response()->json([
            'total_invitations' => $invitations->count(),
            'total_guests' => $totalGuests,
            'confirmed_guests' => $confirmedGuests,
            'rejected_guests' => $rejectedGuests,
            'pending_guests' => $pendingGuests,
        ]);
    }
}
