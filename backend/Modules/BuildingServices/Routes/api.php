<?php

namespace Modules\BuildingServices\Routes;

use Illuminate\Support\Facades\Route;
use Modules\BuildingServices\Http\Controllers\BuildingServiceController;

Route::prefix('api')->group(function () {
    Route::get('/building-services', [BuildingServiceController::class, 'index']);
    Route::get('/building-services/workers/{id}', [BuildingServiceController::class, 'worker']);
    Route::get('/building-services/workers', [BuildingServiceController::class, 'workers']);
    Route::get('/building-services/{id}', [BuildingServiceController::class, 'show'])
        ->middleware('auth:sanctum');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/building-services/book', [BuildingServiceController::class, 'store']);
        Route::post('/building-services/bookings', [BuildingServiceController::class, 'store']);
        Route::get('/building-services/my-bookings', [BuildingServiceController::class, 'myBookings']);
        Route::get('/building-services/bookings', [BuildingServiceController::class, 'bookings']);
        Route::get('/building-services/bookings/{id}', [BuildingServiceController::class, 'booking']);
        Route::post('/building-services/bookings/{id}/assign', [BuildingServiceController::class, 'assignWorker']);
        Route::post('/building-services/bookings/{id}/transition', [BuildingServiceController::class, 'transition']);
    });
});
