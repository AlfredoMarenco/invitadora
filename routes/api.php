<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\WeddingController;
use App\Http\Controllers\Admin\GalleryController;
use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Public\PublicWeddingController;
use App\Http\Controllers\Public\PublicRsvpController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Rutas Públicas (React Frontend)
Route::prefix('public')->group(function () {
    // Ya no requerimos el slug porque solo hay una boda
    Route::get('/wedding', [PublicWeddingController::class, 'show']);
    Route::get('/rsvp/{token}', [PublicRsvpController::class, 'show']);
    Route::put('/rsvp/{token}', [PublicRsvpController::class, 'update']);
});

// Rutas Administrativas (Protegidas) - para pruebas omitimos auth:sanctum por ahora
// En producción: Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
Route::prefix('admin')->group(function () {
    Route::apiResource('gallery', GalleryController::class);
    Route::apiResource('invitations', InvitationController::class);
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::get('settings', [WeddingController::class, 'edit']);
    Route::put('settings', [WeddingController::class, 'update']);
});
