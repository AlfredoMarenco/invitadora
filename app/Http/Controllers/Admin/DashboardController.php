<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Models\Wedding;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $wedding = Wedding::with(['invitations.guests', 'galleryImages', 'hotels'])->first();

        $totalInvitations = $wedding ? $wedding->invitations->count() : 0;
        $totalGuests = 0;
        $confirmedGuests = 0;
        $rejectedGuests = 0;
        $pendingGuests = 0;
        $checkedInGuests = 0;

        if ($wedding) {
            foreach ($wedding->invitations as $invitation) {
                foreach ($invitation->guests as $guest) {
                    $totalGuests++;
                    if ($guest->is_attending === true) {
                        $confirmedGuests++;
                    } elseif ($guest->is_attending === false) {
                        $rejectedGuests++;
                    } else {
                        $pendingGuests++;
                    }
                    if ($guest->has_entered) {
                        $checkedInGuests++;
                    }
                }
            }
        }

        $totalTables = $wedding ? $wedding->tables()->count() : 0;
        $tablesCapacity = $wedding ? (int) $wedding->tables()->sum('capacity') : 0;
        $assignedGuests = $wedding ? Guest::whereHas('invitation', function ($q) use ($wedding) {
            $q->where('wedding_id', $wedding->id);
        })->whereNotNull('table_id')->count() : 0;

        return Inertia::render('dashboard', [
            'wedding' => $wedding,
            'stats' => [
                'total_invitations' => $totalInvitations,
                'total_guests' => $totalGuests,
                'confirmed_guests' => $confirmedGuests,
                'rejected_guests' => $rejectedGuests,
                'pending_guests' => $pendingGuests,
                'checked_in_guests' => $checkedInGuests,
                'gallery_count' => $wedding ? $wedding->galleryImages->count() : 0,
                'hotels_count' => $wedding ? $wedding->hotels->count() : 0,
                'total_tables' => $totalTables,
                'tables_capacity' => $tablesCapacity,
                'assigned_guests' => $assignedGuests,
            ],
            'recentInvitations' => $wedding
                ? $wedding->invitations()->with('guests')->latest()->take(6)->get()
                : [],
        ]);
    }
}
