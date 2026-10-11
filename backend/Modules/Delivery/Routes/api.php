<?php

use Illuminate\Support\Facades\Route;
use Modules\Delivery\Http\Controllers\DeliveryController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/delivery/managers', [DeliveryController::class, 'index']);
    Route::post('/delivery/managers', [DeliveryController::class, 'store']);
    Route::get('/delivery/managers/{id}', [DeliveryController::class, 'show']);
    Route::put('/delivery/managers/{id}', [DeliveryController::class, 'update']);
    Route::post('/delivery/managers/{id}/deliver', [DeliveryController::class, 'markDelivered']);
    Route::post('/delivery/managers/{id}/fail', [DeliveryController::class, 'markFailed']);
    Route::put('/delivery/availability', [DeliveryController::class, 'updateAvailability']);
    Route::get('/delivery/my', [DeliveryController::class, 'myDeliveries']);
    Route::get('/delivery/rates', [DeliveryController::class, 'rates']);

    // Plan G2: order <-> rider assignment ledger.
    Route::post('/delivery/assign/{orderId}', [DeliveryController::class, 'assign']);
    Route::get('/delivery/queue', [DeliveryController::class, 'queue']);
    Route::get('/delivery/history', [DeliveryController::class, 'history']);
    Route::post('/delivery/{id}/transition', [DeliveryController::class, 'transition']);
    Route::get('/delivery/order/{orderId}', [DeliveryController::class, 'trackingForOrder']);
});
