<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Models\Wedding;

// La vista pública de la invitación
Route::get('/', function () {
    $wedding = Wedding::with(['galleryImages', 'hotels' => function ($q) {
        $q->where('is_active', true)->orderBy('order');
    }])->first();
    return Inertia::render('invitation', [
        'wedding' => $wedding,
        'invitation' => null,
    ]);
})->name('home');

// El panel de administración para configurar ESTA invitación
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
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
            ],
            'recentInvitations' => $wedding 
                ? $wedding->invitations()->with('guests')->latest()->take(6)->get() 
                : [],
        ]);
    })->name('dashboard');
});

require __DIR__.'/settings.php';
