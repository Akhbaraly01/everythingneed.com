<?php

use Illuminate\Support\Facades\Route;
use Modules\Pharmacy\Http\Controllers\MedicineController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/prescriptions', [\Modules\Pharmacy\Http\Controllers\PrescriptionController::class, 'index']);
        Route::post('/medicines', [MedicineController::class, 'store'])->middleware('role:super_admin');
        Route::put('/medicines/{id}', [MedicineController::class, 'update'])->middleware('role:super_admin');
    });

    // Public reads
    Route::get('/medicines', [MedicineController::class, 'index']);
    Route::get('/medicines/{id}', [MedicineController::class, 'show']);
});
