<?php

use Illuminate\Support\Facades\Route;
use Modules\RealEstate\Http\Controllers\PropertyController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::get('/properties/my-listings', [PropertyController::class, 'myListings']);
        Route::post('/properties/{id}/inquiries', [PropertyController::class, 'inquiry']);
        Route::post('/properties/{id}/viewing-requests', [PropertyController::class, 'inquiry']);
    });

    // Public reads
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::get('/properties/{id}', [PropertyController::class, 'show']);

    // Admin console: create a listing (spec 47)
    Route::post('/admin/properties', [PropertyController::class, 'store'])
        ->middleware('role:super_admin,administrator,real_estate_admin');
});
