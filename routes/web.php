<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Public\PublicWeddingController;
use Illuminate\Support\Facades\Route;

// La vista pública de la invitación
Route::get('/', [PublicWeddingController::class, 'show'])->name('home');

// El panel de administración para configurar ESTA invitación
Route::middleware(['auth'])->group(function () {
    Route::redirect('/admin', '/dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__.'/settings.php';
