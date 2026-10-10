<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Public\PublicWeddingController;
use App\Http\Controllers\Public\PublicRsvpController;

// Endpoint para guardar la confirmación
Route::put('/public/rsvp/{token}', [PublicRsvpController::class, 'update'])->name('public.rsvp.update');

// Ruta para ver la landing page con el token de confirmación
Route::get('/public/rsvp/{token}', [PublicWeddingController::class, 'showWithToken'])->name('public.wedding.rsvp');

