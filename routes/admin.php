<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\WeddingController;
use App\Http\Controllers\Admin\GalleryController;
use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\Admin\DashboardController;

Route::get('settings', [WeddingController::class, 'edit'])->name('admin.wedding.settings');
Route::put('settings', [WeddingController::class, 'update'])->name('admin.wedding.update');
Route::post('timeline/upload-icon', [WeddingController::class, 'uploadTimelineIcon'])->name('admin.timeline.upload-icon');

Route::put('gallery/reorder', [GalleryController::class, 'reorder'])->name('admin.gallery.reorder');
Route::resource('gallery', GalleryController::class);
Route::get('invitations/export', [InvitationController::class, 'export'])->name('admin.invitations.export');
Route::resource('invitations', InvitationController::class);
Route::put('invitations/{invitation}/assign-table', [InvitationController::class, 'assignTable'])->name('invitations.assign-table');

use App\Http\Controllers\Admin\GuestController;
use App\Http\Controllers\Admin\WeddingTableController;

Route::put('tables/batch-positions', [WeddingTableController::class, 'batchPositions'])->name('admin.tables.batch-positions');
Route::put('tables/{table}/position', [WeddingTableController::class, 'updatePosition'])->name('admin.tables.update-position');
Route::put('venue-elements', [WeddingTableController::class, 'updateVenueElements'])->name('admin.venue-elements.update');
Route::resource('tables', WeddingTableController::class)->except(['create', 'show', 'edit']);
Route::put('guests/{guest}', [GuestController::class, 'update'])->name('admin.guests.update');

use App\Http\Controllers\Admin\CheckInController;
Route::get('checkin', [CheckInController::class, 'index'])->name('admin.checkin.index');
Route::post('checkin/scan', [CheckInController::class, 'scan'])->name('admin.checkin.scan');
Route::put('guests/{guest}/checkin', [CheckInController::class, 'toggle'])->name('admin.checkin.toggle');
Route::put('invitations/{invitation}/checkin', [CheckInController::class, 'toggleInvitation'])->name('admin.checkin.toggle-invitation');
use App\Http\Controllers\Admin\HotelController;
Route::put('hotels/reorder', [HotelController::class, 'reorder'])->name('hotels.reorder');
Route::put('hotels/{hotel}/toggle', [HotelController::class, 'toggle'])->name('hotels.toggle');
Route::resource('hotels', HotelController::class);

use App\Http\Controllers\Admin\NotificationController;
Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
Route::put('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
Route::put('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
