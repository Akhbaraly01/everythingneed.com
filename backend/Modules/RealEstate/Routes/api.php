<?php

use Illuminate\Support\Facades\Route;
use Modules\RealEstate\Http\Controllers\PropertyController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/properties', [PropertyController::class, 'store']);
    });

    // Public reads
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::get('/properties/{id}', [PropertyController::class, 'show']);
});
