<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Models\Wedding;

// La vista pública de la invitación
Route::get('/', function () {
    $wedding = Wedding::with('galleryImages')->first();
    return Inertia::render('invitation', [
        'wedding' => $wedding
    ]);
})->name('home');

// El panel de administración para configurar ESTA invitación
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
