<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\EnsureAccountActive;
use Modules\Hotels\Http\Controllers\HotelController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/hotels/{id}/reserve', [HotelController::class, 'reserve']);
        Route::get('/hotels/reservations/mine', [HotelController::class, 'myReservations']);
        Route::get('/hotels/reservations/{id}', [HotelController::class, 'showReservation']);
        Route::post('/hotels/reservations/{id}/pay', [HotelController::class, 'pay']);
        Route::post('/hotels/reservations/{id}/cancel', [HotelController::class, 'cancelReservation']);
        Route::post('/hotels/reservations/{id}/check-in', [HotelController::class, 'checkIn']);
        Route::post('/hotels/reservations/{id}/check-out', [HotelController::class, 'checkOut']);
        // Spec aliases: /hotels/bookings* resolve to the same reservations.
        Route::get('/hotels/bookings', [HotelController::class, 'myReservations']);
        Route::get('/hotels/bookings/{id}', [HotelController::class, 'showReservation']);
    });

    // Public reads
    Route::get('/hotels', [HotelController::class, 'index']);

    // Admin console (all hotels incl. inactive).
    // Permissions are the authority: the catalogue read is
    // hotels.overview.view, every write is hotels.overview.manage. The
    // seeded roles (super_admin, administrator, hotel_admin) all hold
    // hotels.* in PermissionSeeder::MATRIX, so they keep working, and a
    // custom role that holds the permission is no longer blocked by a
    // role list that never named it.
    Route::get('/admin/hotels', [HotelController::class, 'adminIndex'])
        ->middleware(['auth:sanctum', EnsureAccountActive::class, 'permission:hotels.overview.view']);
    Route::put('/admin/hotels/{id}', [HotelController::class, 'adminUpdate'])
        ->middleware(['auth:sanctum', EnsureAccountActive::class, 'permission:hotels.overview.manage']);
    Route::delete('/admin/hotels/{id}', [HotelController::class, 'adminDestroy'])
        ->middleware(['auth:sanctum', EnsureAccountActive::class, 'permission:hotels.overview.manage']);
    Route::post('/admin/hotels', [HotelController::class, 'adminStore'])
        ->middleware(['auth:sanctum', EnsureAccountActive::class, 'permission:hotels.overview.manage']);
    Route::get('/hotels/{id}/rooms/{roomId}', [HotelController::class, 'room']);
    Route::get('/hotels/{id}', [HotelController::class, 'show']);
    Route::get('/hotels/{id}/rooms', [HotelController::class, 'rooms']);
});
