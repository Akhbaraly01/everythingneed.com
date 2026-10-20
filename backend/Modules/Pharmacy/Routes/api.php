<?php

use Illuminate\Support\Facades\Route;
use Modules\Pharmacy\Http\Controllers\MedicineController;
use Modules\Pharmacy\Http\Controllers\PharmacyAdminController;
use Modules\Pharmacy\Http\Controllers\PharmacyOrderController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/prescriptions', [\Modules\Pharmacy\Http\Controllers\PrescriptionController::class, 'index']);
        Route::get('/prescriptions/{id}', [\Modules\Pharmacy\Http\Controllers\PrescriptionController::class, 'show']);
        Route::post('/prescriptions/{id}/order', [\Modules\Pharmacy\Http\Controllers\PrescriptionController::class, 'order']);
        Route::post('/pharmacy/prescriptions', [PharmacyOrderController::class, 'storePrescription']);
        Route::post('/medicines', [MedicineController::class, 'store'])->middleware('role:super_admin,administrator,pharmacy_admin');
        Route::put('/medicines/{id}', [MedicineController::class, 'update'])->middleware('role:super_admin,administrator,pharmacy_admin');
        Route::delete('/medicines/{id}', [MedicineController::class, 'destroy'])->middleware('role:super_admin,administrator,pharmacy_admin');

        Route::get('/pharmacy/orders', [PharmacyOrderController::class, 'orders']);
        Route::get('/pharmacy/orders/{id}', [PharmacyOrderController::class, 'show']);
        Route::post('/pharmacy/orders', [PharmacyOrderController::class, 'store']);
        Route::post('/pharmacy/orders/{id}/cancel', [PharmacyOrderController::class, 'cancel']);
    });

    // Public reads
    Route::get('/medicines', [MedicineController::class, 'index']);
    Route::get('/medicines/{id}', [MedicineController::class, 'show']);
});

// Fulfillment console (W4): pending -> confirmed -> processing ->
// shipped -> delivered, plus cancelling with restock.
Route::middleware(['auth:sanctum', 'role:super_admin,administrator,pharmacy_admin'])
    ->prefix('api/admin/pharmacy')
    ->group(function () {
        Route::post('/orders/{id}/confirm', [PharmacyAdminController::class, 'confirm']);
        Route::post('/orders/{id}/process', [PharmacyAdminController::class, 'process']);
        Route::post('/orders/{id}/ship', [PharmacyAdminController::class, 'ship']);
        Route::post('/orders/{id}/deliver', [PharmacyAdminController::class, 'deliver']);
        Route::post('/orders/{id}/cancel', [PharmacyAdminController::class, 'cancel']);
    });

// H-D: prescriptions oversight is read-only and mirrors the seeded
// matrix (healthcare_admin holds pharmacy.prescriptions.view), so the
// Healthcare console's Prescriptions tab can serve it.
Route::middleware(['auth:sanctum', 'role:super_admin,administrator,pharmacy_admin,healthcare_admin'])
    ->prefix('api/admin/pharmacy')
    ->group(function () {
        Route::get('/prescriptions', [PharmacyAdminController::class, 'prescriptions']);
    });
