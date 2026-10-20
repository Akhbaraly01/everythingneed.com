<?php

use Illuminate\Support\Facades\Route;
use Modules\Bookings\Http\Controllers\BookingController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/vendor/bookings', [BookingController::class, 'vendorBookings']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
    Route::post('/bookings/{id}/confirm', [BookingController::class, 'confirm']);
    Route::post('/bookings/{id}/complete', [BookingController::class, 'complete']);
    Route::post('/bookings/{id}/check-in', [BookingController::class, 'checkIn']);
    Route::post('/bookings/{id}/check-out', [BookingController::class, 'checkOut']);
});
