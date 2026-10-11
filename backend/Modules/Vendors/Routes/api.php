<?php

use Illuminate\Support\Facades\Route;
use Modules\Vendors\Http\Controllers\VendorController;
use Modules\Vendors\Http\Controllers\VendorEarningsController;
use Modules\Vendors\Http\Controllers\VendorWorkspaceController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/vendors/mine', [VendorController::class, 'mine']);
        Route::get('/vendor/earnings', [VendorEarningsController::class, 'summary']);
        Route::get('/vendor/payouts', [VendorEarningsController::class, 'payouts']);
        Route::post('/vendor/payouts/request', [VendorEarningsController::class, 'requestPayout']);

        // Spec §34 vendor workspace.
        Route::get('/vendor/profile', [VendorWorkspaceController::class, 'profile']);
        Route::put('/vendor/profile', [VendorWorkspaceController::class, 'updateProfile']);
        Route::put('/vendor/settings', [VendorWorkspaceController::class, 'updateSettings']);
        Route::get('/vendor/services', [VendorWorkspaceController::class, 'services']);
        Route::post('/vendor/services', [VendorWorkspaceController::class, 'storeService']);
        Route::get('/vendor/services/{id}', [VendorWorkspaceController::class, 'showService']);
        Route::put('/vendor/services/{id}', [VendorWorkspaceController::class, 'updateService']);
        Route::delete('/vendor/services/{id}', [VendorWorkspaceController::class, 'destroyService']);
        Route::get('/vendor/reviews', [VendorWorkspaceController::class, 'reviews']);
        Route::get('/vendor/bookings', [VendorWorkspaceController::class, 'bookings']);

        Route::post('/vendors', [VendorController::class, 'store']);
        Route::post('/vendors/{id}/approve', [VendorController::class, 'approve'])->middleware('permission:vendors.vendors.approve');
        Route::post('/vendors/{id}/suspend', [VendorController::class, 'suspend'])->middleware('permission:vendors.vendors.approve');
    });

    // Public reads
    Route::get('/vendors', [VendorController::class, 'index']);
    Route::get('/vendors/{id}', [VendorController::class, 'show']);
});
