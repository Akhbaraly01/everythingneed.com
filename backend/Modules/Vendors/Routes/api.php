<?php

use Illuminate\Support\Facades\Route;
use Modules\Vendors\Http\Controllers\VendorController;
use Modules\Vendors\Http\Controllers\VendorEarningsController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/vendors/mine', [VendorController::class, 'mine']);
        Route::get('/vendor/earnings', [VendorEarningsController::class, 'summary']);
        Route::get('/vendor/payouts', [VendorEarningsController::class, 'payouts']);
        Route::post('/vendor/payouts/request', [VendorEarningsController::class, 'requestPayout']);
        Route::post('/vendors', [VendorController::class, 'store']);
        Route::post('/vendors/{id}/approve', [VendorController::class, 'approve'])->middleware('permission:vendors.approve');
        Route::post('/vendors/{id}/suspend', [VendorController::class, 'suspend'])->middleware('permission:vendors.approve');
    });

    // Public reads
    Route::get('/vendors', [VendorController::class, 'index']);
    Route::get('/vendors/{id}', [VendorController::class, 'show']);
});
