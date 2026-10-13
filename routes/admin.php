<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\WeddingController;
use App\Http\Controllers\Admin\GalleryController;
use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\Admin\DashboardController;

Route::get('settings', [WeddingController::class, 'edit'])->name('admin.wedding.settings');
Route::put('settings', [WeddingController::class, 'update'])->name('admin.wedding.update');

Route::put('gallery/reorder', [GalleryController::class, 'reorder'])->name('admin.gallery.reorder');
Route::resource('gallery', GalleryController::class);
Route::get('invitations/export', [InvitationController::class, 'export'])->name('admin.invitations.export');
Route::resource('invitations', InvitationController::class);

use App\Http\Controllers\Admin\GuestController;
Route::put('guests/{guest}', [GuestController::class, 'update'])->name('admin.guests.update');

use App\Http\Controllers\Admin\CheckInController;
Route::get('checkin', [CheckInController::class, 'index'])->name('admin.checkin.index');
Route::put('guests/{guest}/checkin', [CheckInController::class, 'toggle'])->name('admin.checkin.toggle');
Route::put('invitations/{invitation}/checkin', [CheckInController::class, 'toggleInvitation'])->name('admin.checkin.toggle-invitation');
use App\Http\Controllers\Admin\HotelController;
Route::put('hotels/reorder', [HotelController::class, 'reorder'])->name('hotels.reorder');
Route::put('hotels/{hotel}/toggle', [HotelController::class, 'toggle'])->name('hotels.toggle');
Route::resource('hotels', HotelController::class);
