<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Public\PublicWeddingController;
use App\Http\Controllers\Public\PublicRsvpController;

// Endpoint para guardar la confirmación general desde landing (sin token)
Route::post('/public/rsvp/submit', [PublicRsvpController::class, 'submitGeneral'])->name('public.rsvp.general');

// Endpoint para guardar la confirmación personalizada con token (soporta PUT y POST)
Route::match(['put', 'post'], '/public/rsvp/{token}', [PublicRsvpController::class, 'update'])->name('public.rsvp.update');

// Ruta para ver la landing page con el token de confirmación
Route::get('/public/rsvp/{token}', [PublicWeddingController::class, 'showWithToken'])->name('public.wedding.rsvp');

