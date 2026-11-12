<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Wedding;
use App\Support\ShareMeta;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicWeddingController extends Controller
{
    public function show(Request $request)
    {
        $wedding = Wedding::with([
            'galleryImages' => function ($q) {
                $q->where('is_active', true)->orderBy('order');
            },
            'hotels' => function ($q) {
                $q->where('is_active', true)->orderBy('order');
            },
        ])
            ->first();

        $meta = ShareMeta::forInvitation($wedding, null, $request->url());

        return Inertia::render('invitation', [
            'wedding' => $wedding,
            'invitation' => null, // Sin invitación
            'rsvp' => $wedding?->rsvpWindow() ?? ['deadline' => null, 'closed' => false],
            'meta' => $meta,
        ])->withViewData(['meta' => $meta]);
    }

    public function showWithToken(Request $request, $token)
    {
        $wedding = Wedding::with([
            'galleryImages' => function ($q) {
                $q->where('is_active', true)->orderBy('order');
            },
            'hotels' => function ($q) {
                $q->where('is_active', true)->orderBy('order');
            },
        ])
            ->firstOrFail();

        $invitation = Invitation::where('token', $token)
            ->where('wedding_id', $wedding->id)
            ->with('guests')
            ->firstOrFail();

        if (
            $invitation->status === 'pending'
            && ! ShareMeta::isPreviewBot($request)
            && ! $request->user()
            && ! $request->boolean('preview')
        ) {
            $invitation->update(['status' => 'viewed']);
        }

        $meta = ShareMeta::forInvitation($wedding, $invitation, $request->url());

        $invitation->setRelation('wedding', $wedding);
        $rsvpWindow = $invitation->rsvpWindow();
        $invitation->unsetRelation('wedding'); // Evita duplicar la boda dentro del payload

        return Inertia::render('invitation', [
            'wedding' => $wedding,
            'invitation' => $invitation,
            'rsvp' => $rsvpWindow,
            'meta' => $meta,
        ])->withViewData(['meta' => $meta]);
    }
}
