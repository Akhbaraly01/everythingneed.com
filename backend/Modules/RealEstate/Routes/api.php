<?php

use Illuminate\Support\Facades\Route;
use Modules\RealEstate\Http\Controllers\PropertyController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::post('/properties/{id}/inquiries', function (string $id, \Illuminate\Http\Request $request) {
            $validated = $request->validate(['name' => 'required|string|max:255', 'email' => 'required|email', 'phone' => 'required|string|max:30', 'message' => 'required|string|max:2000', 'viewing_date' => 'nullable|date']);
            $prop = \Modules\RealEstate\Entities\Property::find($id); if (!$prop) return response()->json(['message' => 'Property not found'], 404);
            $inquiry = \Modules\RealEstate\Entities\ViewingRequest::create(['property_id' => $id, 'user_id' => $request->user()->id, 'name' => $validated['name'], 'email' => $validated['email'], 'phone' => $validated['phone'], 'message' => $validated['message'], 'viewing_date' => $validated['viewing_date'] ?? null, 'status' => 'pending']);
            return response()->json(['data' => $inquiry], 201);
        });
        Route::post('/properties/{id}/viewing-requests', function (string $id, \Illuminate\Http\Request $request) {
            return app(\Modules\RealEstate\Http\Controllers\PropertyController::class)->store($request);
        });
    });

    // Public reads
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::get('/properties/{id}', [PropertyController::class, 'show']);
});
