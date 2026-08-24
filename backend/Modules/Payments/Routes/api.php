<?php

use Illuminate\Support\Facades\Route;
use Modules\Payments\Http\Controllers\PaymentController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments/charge', [PaymentController::class, 'charge']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::post('/payments/{id}/refund', [PaymentController::class, 'refund'])->middleware('role:super_admin');
});