<?php

use Illuminate\Support\Facades\Route;
use Modules\Delivery\Http\Controllers\DeliveryController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/delivery/managers', [DeliveryController::class, 'index'])
        ->middleware('permission:delivery.deliveries.view');
    // Self-service registration/edits stay open to riders; the controller
    // escalates to delivery.deliveries.manage when acting on another account.
    Route::post('/delivery/managers', [DeliveryController::class, 'store']);
    // Riders (self), vendors (stripped) and ops all reach show(); the
    // controller fans out the response shape by authority.
    Route::get('/delivery/managers/{id}', [DeliveryController::class, 'show']);
    Route::put('/delivery/managers/{id}', [DeliveryController::class, 'update']);
    Route::delete('/delivery/managers/{id}', [DeliveryController::class, 'destroy'])
        ->middleware('permission:delivery.deliveries.manage');
    Route::post('/delivery/managers/{id}/deliver', [DeliveryController::class, 'markDelivered']);
    Route::post('/delivery/managers/{id}/fail', [DeliveryController::class, 'markFailed']);
    Route::put('/delivery/availability', [DeliveryController::class, 'updateAvailability']);
    Route::get('/delivery/my', [DeliveryController::class, 'myDeliveries']);
    Route::get('/delivery/rates', [DeliveryController::class, 'rates']);

    // Plan G2: order <-> rider assignment ledger.
    Route::post('/delivery/assign/{orderId}', [DeliveryController::class, 'assign'])
        ->middleware('permission:delivery.deliveries.manage');
    Route::get('/delivery/queue', [DeliveryController::class, 'queue']);
    Route::get('/delivery/history', [DeliveryController::class, 'history']);
    Route::post('/delivery/{id}/transition', [DeliveryController::class, 'transition']);
    Route::get('/delivery/order/{orderId}', [DeliveryController::class, 'trackingForOrder']);
});
