<?php

use Illuminate\Support\Facades\Route;
use Modules\Food\Http\Controllers\RestaurantController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/restaurants/{id}/order', [RestaurantController::class, 'order']);
        Route::put('/menu-items/{id}/toggle', [RestaurantController::class, 'toggleMenuItem']);
    });

    // Public reads
    Route::get('/restaurants', [RestaurantController::class, 'index']);
    Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);
    Route::get('/restaurants/{id}/menu', [RestaurantController::class, 'menu']);
});
