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
});
