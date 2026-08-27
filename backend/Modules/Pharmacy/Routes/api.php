<?php

use Illuminate\Support\Facades\Route;
use Modules\Pharmacy\Http\Controllers\MedicineController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/prescriptions', [\Modules\Pharmacy\Http\Controllers\PrescriptionController::class, 'index']);
        Route::post('/pharmacy/prescriptions', function (\Illuminate\Http\Request $request) {
            $request->validate(['prescription' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120', 'notes' => 'nullable|string|max:1000']);
            $path = $request->file('prescription')->store('prescriptions', 'public');
            $order = \Modules\Orders\Entities\MedicineOrder::create(['user_id' => $request->user()->id, 'order_number' => 'MED-' . strtoupper(\Illuminate\Support\Str::random(8)), 'delivery_address' => $request->input('delivery_address', 'Address on file'), 'prescription_url' => $path, 'total_amount' => 0, 'status' => 'pending']);
            return response()->json(['data' => $order], 201);
        });
        Route::post('/medicines', [MedicineController::class, 'store'])->middleware('role:super_admin');
        Route::put('/medicines/{id}', [MedicineController::class, 'update'])->middleware('role:super_admin');
    });

    // Public reads
    Route::get('/medicines', [MedicineController::class, 'index']);
    Route::get('/medicines/{id}', [MedicineController::class, 'show']);
});
