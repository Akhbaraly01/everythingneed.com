<?php

use Illuminate\Support\Facades\Route;
use Modules\Wallet\Http\Controllers\WalletController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/wallet/balance', [WalletController::class, 'balance']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
    Route::post('/wallet/deposit', [WalletController::class, 'deposit']);
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw']);
});
