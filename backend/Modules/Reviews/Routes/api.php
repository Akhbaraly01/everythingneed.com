<?php

use Illuminate\Support\Facades\Route;
use Modules\Reviews\Http\Controllers\ReviewController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    });

    // Public read
    Route::get('/reviews', [ReviewController::class, 'index']);
});
