<?php

use Illuminate\Support\Facades\Route;
use Modules\Food\Http\Controllers\FoodOrderController;
use Modules\Food\Http\Controllers\RestaurantController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/restaurants/{id}/order', [RestaurantController::class, 'order']);
        Route::put('/menu-items/{id}/toggle', [RestaurantController::class, 'toggleMenuItem']);
    });

    // Public reads
    Route::get('/restaurants', [RestaurantController::class, 'index']);

    // Admin console (all restaurants incl. inactive)
    Route::get('/admin/restaurants', [RestaurantController::class, 'adminIndex'])
        ->middleware('role:super_admin,administrator,food_admin');
    Route::put('/admin/restaurants/{id}', [RestaurantController::class, 'adminUpdate'])
        ->middleware('role:super_admin,administrator,food_admin');
    Route::delete('/admin/restaurants/{id}', [RestaurantController::class, 'adminDestroy'])
        ->middleware('role:super_admin,administrator,food_admin');
    Route::post('/admin/restaurants', [RestaurantController::class, 'adminStore'])
        ->middleware('role:super_admin,administrator,food_admin');
    Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);
    Route::get('/restaurants/{id}/menu', [RestaurantController::class, 'menu']);

    // Compat for deep pages: food cart/history (maps to food_orders)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/food/orders', [FoodOrderController::class, 'index']);
        Route::get('/food/orders/{id}', [FoodOrderController::class, 'show']);
        Route::post('/food/orders', [FoodOrderController::class, 'store']);
    });
});
