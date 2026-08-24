<?php

use Illuminate\Support\Facades\Route;
use Modules\Rides\Http\Controllers\RideController;
use Modules\Rides\Http\Controllers\FlightController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::post('/rides/request', [RideController::class, 'requestRide']);
    Route::post('/rides/{id}/accept', [RideController::class, 'acceptRide']);
    Route::get('/my-rides', [RideController::class, 'myRides']);
    Route::get('/rides/{id}', [RideController::class, 'show']);

    // Flight booking (auth)
    Route::post('/flights/{id}/book', [FlightController::class, 'book']);
});

// Public flight search
Route::prefix('api')->group(function () {
    Route::get('/flights', [FlightController::class, 'search']);
    Route::get('/flights/{id}', [FlightController::class, 'show']);
});
