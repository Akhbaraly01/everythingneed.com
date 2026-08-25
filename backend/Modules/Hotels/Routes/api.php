<?php

use Illuminate\Support\Facades\Route;
use Modules\Hotels\Http\Controllers\HotelController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/hotels/{id}/reserve', [HotelController::class, 'reserve']);
        Route::get('/hotels/reservations/mine', [HotelController::class, 'myReservations']);
        Route::post('/hotels/reservations/{id}/cancel', [HotelController::class, 'cancelReservation']);
        Route::post('/hotels/reservations/{id}/check-in', [HotelController::class, 'checkIn']);
        Route::post('/hotels/reservations/{id}/check-out', [HotelController::class, 'checkOut']);
    });

    // Public reads
    Route::get('/hotels', [HotelController::class, 'index']);
    Route::get('/hotels/{id}', [HotelController::class, 'show']);
    Route::get('/hotels/{id}/rooms', [HotelController::class, 'rooms']);
});
