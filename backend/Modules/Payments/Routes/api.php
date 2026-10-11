<?php

use Illuminate\Support\Facades\Route;
use Modules\Payments\Http\Controllers\PaymentController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments/charge', [PaymentController::class, 'charge'])
        ->middleware('throttle:30,1');
    Route::get('/payments/methods', [PaymentController::class, 'methods']);
    Route::get('/payment-methods', [PaymentController::class, 'savedMethods']);
    Route::post('/payment-methods', [PaymentController::class, 'storeMethod'])
        ->middleware('throttle:30,1');
    Route::delete('/payment-methods/{id}', [PaymentController::class, 'removeMethod']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    // Gap 3: refund REQUEST (pending until support reviews) + own requests.
    Route::post('/payments/{id}/refund-request', [PaymentController::class, 'requestRefund'])
        ->middleware('throttle:10,1');
    Route::get('/refunds/mine', [PaymentController::class, 'myRefunds']);
    Route::post('/payments/{id}/refund', [PaymentController::class, 'refund'])
        ->middleware(['role:super_admin', 'throttle:10,1']);
});