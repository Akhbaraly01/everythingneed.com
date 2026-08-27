<?php

use Illuminate\Support\Facades\Route;
use Modules\Rides\Http\Controllers\RideController;
use Modules\Rides\Http\Controllers\FlightController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::post('/rides/request', [RideController::class, 'requestRide']);
    // Compat aliases for deep pages
    Route::post('/rides', [RideController::class, 'requestRide']);
    Route::get('/rides/available', function (\Illuminate\Http\Request $request) {
        $drivers = \Modules\Rides\Entities\Driver::where('is_available', true)->limit(10)->get()->map(fn($d) => ['id' => $d->id, 'driver' => ['full_name' => $d->full_name, 'rating' => $d->rating, 'vehicle_type' => $d->vehicle_type], 'vehicle_type' => $d->vehicle_type, 'estimated_fare' => rand(10, 50), 'estimated_time' => rand(5, 20) . ' min']);
        return response()->json(['data' => $drivers]);
    });
    Route::get('/rides', [RideController::class, 'myRides']);
    Route::post('/transport/requests', [RideController::class, 'requestRide']);
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
