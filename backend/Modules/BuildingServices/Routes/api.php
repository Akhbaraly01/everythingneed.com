<?php

namespace Modules\BuildingServices\Routes;

use Illuminate\Support\Facades\Route;
use Modules\BuildingServices\Http\Controllers\BuildingServiceController;

Route::prefix('api')->group(function () {
    Route::get('/building-services', [BuildingServiceController::class, 'index']);
    Route::get('/building-services/{id}', [BuildingServiceController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/building-services/book', [BuildingServiceController::class, 'store']);
        Route::get('/building-services/my-bookings', [BuildingServiceController::class, 'myBookings']);
    });
});
