<?php

use Illuminate\Support\Facades\Route;
use Modules\Checkout\Http\Controllers\CartController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/cart', [CartController::class, 'show']);
        Route::post('/cart/items', [CartController::class, 'addItem']);
        Route::put('/cart/items/{itemId}', [CartController::class, 'updateItem']);
        Route::delete('/cart/items/{itemId}', [CartController::class, 'removeItem']);
        Route::delete('/cart', [CartController::class, 'clear']);
        Route::post('/cart/coupon', [CartController::class, 'applyCoupon']);
    });
});
