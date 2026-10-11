<?php

use Illuminate\Support\Facades\Route;
use Modules\Orders\Http\Controllers\OrderController;
use Modules\Orders\Http\Controllers\ProductOrderController;
use Modules\Orders\Http\Controllers\ReturnRequestController;
use Modules\Orders\Http\Controllers\DisputeController;

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
    Route::get('/orders/{id}/tracking', [ProductOrderController::class, 'tracking']);
    Route::get('/product-orders/{id}', [ProductOrderController::class, 'show']);
    Route::post('/product-orders/{id}/cancel', [ProductOrderController::class, 'cancel']);
    Route::post('/product-orders/{id}/complete', [ProductOrderController::class, 'complete']);

    // Vendor fulfilment workspace
    Route::get('/vendor/orders', [ProductOrderController::class, 'vendorOrders']);
    Route::get('/vendor/orders/top-products', [ProductOrderController::class, 'vendorTopProducts']);
    Route::get('/vendor/orders/{id}', [ProductOrderController::class, 'vendorShow']);
    Route::patch('/vendor/orders/{id}', [ProductOrderController::class, 'vendorUpdate']);
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

/*
|--------------------------------------------------------------------------
| Returns / RMA
|--------------------------------------------------------------------------
*/

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/returns', [ReturnRequestController::class, 'index']);
    Route::post('/returns', [ReturnRequestController::class, 'store']);
    Route::get('/returns/{id}', [ReturnRequestController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| Disputes
|--------------------------------------------------------------------------
*/

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/disputes', [DisputeController::class, 'index']);
    Route::post('/disputes', [DisputeController::class, 'store']);
    Route::get('/disputes/{id}', [DisputeController::class, 'show']);
    Route::post('/disputes/{id}/close', [DisputeController::class, 'close']);
});
