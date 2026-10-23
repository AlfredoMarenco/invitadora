<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Wedding;
use App\Models\Invitation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicWeddingController extends Controller
{
    public function show()
    {
        $wedding = Wedding::with([
                'galleryImages' => function ($q) {
                    $q->where('is_active', true)->orderBy('order');
                },
                'hotels' => function ($q) {
                    $q->where('is_active', true)->orderBy('order');
                }
            ])
            ->firstOrFail();

        return Inertia::render('invitation', [
            'wedding' => $wedding,
            'invitation' => null, // Sin invitación
            'rsvp' => $wedding->rsvpWindow(),
        ]);
    }

    public function showWithToken($token)
    {
        $wedding = Wedding::with([
                'galleryImages' => function ($q) {
                    $q->where('is_active', true)->orderBy('order');
                },
                'hotels' => function ($q) {
                    $q->where('is_active', true)->orderBy('order');
                }
            ])
            ->firstOrFail();

        $invitation = Invitation::where('token', $token)
            ->where('wedding_id', $wedding->id)
            ->with('guests')
            ->firstOrFail();

        if ($invitation->status === 'pending') {
            $invitation->update(['status' => 'viewed']);
        }

        $invitation->setRelation('wedding', $wedding);
        $rsvpWindow = $invitation->rsvpWindow();
        $invitation->unsetRelation('wedding'); // Evita duplicar la boda dentro del payload

        return Inertia::render('invitation', [
            'wedding' => $wedding,
            'invitation' => $invitation,
            'rsvp' => $rsvpWindow,
        ]);
    }
}
