<?php

use Illuminate\Support\Facades\Route;
use Modules\Vendors\Http\Controllers\VendorController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/vendors/mine', [VendorController::class, 'mine']);
        Route::post('/vendors', [VendorController::class, 'store']);
        Route::post('/vendors/{id}/approve', [VendorController::class, 'approve'])->middleware('role:super_admin');
        Route::post('/vendors/{id}/suspend', [VendorController::class, 'suspend'])->middleware('role:super_admin');
    });

    // Public reads
    Route::get('/vendors', [VendorController::class, 'index']);
    Route::get('/vendors/{id}', [VendorController::class, 'show']);
});
