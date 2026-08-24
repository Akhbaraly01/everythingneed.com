<?php

use Illuminate\Support\Facades\Route;
use Modules\Subscriptions\Http\Controllers\SubscriptionController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/subscribe', [SubscriptionController::class, 'subscribe']);
        Route::get('/my-subscription', [SubscriptionController::class, 'mySubscription']);
        Route::post('/unsubscribe', [SubscriptionController::class, 'cancel']);
    });

    // Public read
    Route::get('/plans', [SubscriptionController::class, 'plans']);
});
