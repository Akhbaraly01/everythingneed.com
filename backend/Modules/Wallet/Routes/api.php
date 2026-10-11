<?php

use Illuminate\Support\Facades\Route;
use Modules\Wallet\Http\Controllers\WalletController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/wallet/balance', [WalletController::class, 'balance']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
    Route::get('/wallet/transactions/{id}', [WalletController::class, 'showTransaction']);
    Route::post('/wallet/deposit', [WalletController::class, 'deposit'])
        ->middleware('throttle:30,1');
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw'])
        ->middleware('throttle:10,1');
    Route::post('/wallet/transfer', [WalletController::class, 'transfer'])
        ->middleware('throttle:30,1');
    Route::get('/wallet/available', [WalletController::class, 'available']);
    Route::get('/wallet/holds', [WalletController::class, 'holds']);
    Route::post('/wallet/holds', [WalletController::class, 'placeHold'])
        ->middleware('throttle:30,1');
    Route::post('/wallet/holds/release', [WalletController::class, 'releaseHold'])
        ->middleware('throttle:30,1');
    Route::post('/wallet/holds/capture', [WalletController::class, 'captureHold'])
        ->middleware('throttle:30,1');
});
