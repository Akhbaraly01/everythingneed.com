<?php

use Illuminate\Support\Facades\Route;
use Modules\Orders\Http\Controllers\OrderController;
use Modules\Orders\Http\Controllers\ProductOrderController;

/*
|--------------------------------------------------------------------------
| Marketplace product orders
|--------------------------------------------------------------------------
| Full lifecycle: place → pay → vendor accept → ship → deliver,
| with per-vendor sub-order fulfilment and a tracking timeline.
*/

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/product-orders', [ProductOrderController::class, 'index']);
    Route::post('/product-orders', [ProductOrderController::class, 'store']);
    Route::get('/product-orders/{id}/tracking', [ProductOrderController::class, 'tracking']);
    Route::get('/product-orders/{id}', [ProductOrderController::class, 'show']);
    Route::post('/product-orders/{id}/cancel', [ProductOrderController::class, 'cancel']);

    // Vendor fulfilment workspace
    Route::get('/vendor/orders', [ProductOrderController::class, 'vendorOrders']);
    Route::post('/vendor/orders/{id}/{action}', [ProductOrderController::class, 'vendorTransition'])
        ->whereIn('action', ['accept', 'ship', 'deliver']);
});

/*
|--------------------------------------------------------------------------
| Legacy pharmacy orders (kept for medicine workflows)
|--------------------------------------------------------------------------
*/

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
});
