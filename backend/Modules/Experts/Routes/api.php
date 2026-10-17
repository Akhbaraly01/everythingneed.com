<?php

namespace Modules\Experts\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Experts\Http\Controllers\ExpertController;

Route::prefix('api')->group(function () {
    Route::get('/experts', [ExpertController::class, 'index']);
    Route::get('/experts/categories', [ExpertController::class, 'categories']);

    // Booking routes must precede /experts/{id} so the static
    // `/experts/bookings` path is not swallowed by the wildcard.
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/experts/bookings', [ExpertController::class, 'myBookings']);
        Route::post('/experts/bookings/{bookingId}/cancel', [ExpertController::class, 'cancelBooking']);
        Route::post('/experts/bookings/{bookingId}/pay', [ExpertController::class, 'payBooking']);
        Route::post('/experts/{id}/book', [ExpertController::class, 'storeBooking']);
        Route::post('/experts/{id}/review', [ExpertController::class, 'storeReview']);
    });

    Route::get('/experts/{id}', [ExpertController::class, 'show']);
    Route::get('/experts/{id}/availability', [ExpertController::class, 'availability']);
    Route::get('/experts/{id}/reviews', [ExpertController::class, 'reviews']);
});
