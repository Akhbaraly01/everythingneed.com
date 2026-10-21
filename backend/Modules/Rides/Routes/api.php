<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\EnsureAccountActive;
use Modules\Rides\Http\Controllers\DriverController;
use Modules\Rides\Http\Controllers\DriverEarningsController;
use Modules\Rides\Http\Controllers\RideController;
use Modules\Rides\Http\Controllers\FlightController;

// N-38 fare estimate: registered BEFORE the auth group so GET /rides/{id}
// (same verb+prefix) cannot swallow it as a ride identifier.
Route::get('/api/rides/estimate', [RideController::class, 'estimate']);

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::post('/rides/request', [RideController::class, 'requestRide']);
    // Compat aliases for deep pages
    Route::post('/rides', [RideController::class, 'requestRide']);
    Route::get('/rides/available', [RideController::class, 'available']);
    Route::get('/rides', [RideController::class, 'myRides']);
    Route::post('/transport/requests', [RideController::class, 'requestRide']);
    Route::post('/rides/{id}/accept', [RideController::class, 'acceptRide']);
    Route::post('/rides/{id}/complete', [RideController::class, 'completeRide']);
    Route::post('/rides/{id}/cancel', [RideController::class, 'cancelRide']);
    Route::post('/drivers', [DriverController::class, 'register']);
    Route::get('/drivers/me', [DriverController::class, 'me']);
    Route::put('/drivers/me/availability', [DriverController::class, 'setAvailability']);
    // N-39 driver earnings view + driver-scoped ride history
    Route::get('/drivers/earnings', [DriverEarningsController::class, 'earnings']);
    Route::get('/drivers/rides', [DriverEarningsController::class, 'rides']);
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

// Admin console (all rides/flights incl. inactive)
Route::prefix('api/admin/transport')->middleware(['auth:sanctum', EnsureAccountActive::class])->group(function () {
    Route::get('/rides', [RideController::class, 'adminIndex'])
        ->middleware('permission:rides.overview.view');
    Route::get('/flights', [FlightController::class, 'adminIndex'])
        ->middleware('permission:rides.overview.view');
    Route::put('/flights/{id}', [FlightController::class, 'adminUpdate'])
        ->middleware('permission:rides.flights.manage');
});
