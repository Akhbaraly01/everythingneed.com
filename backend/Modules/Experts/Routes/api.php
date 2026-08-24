<?php

namespace Modules\Experts\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Experts\Http\Controllers\ExpertController;

Route::prefix('api')->group(function () {
    Route::get('/experts', [ExpertController::class, 'index']);
    Route::get('/experts/{id}', [ExpertController::class, 'show']);
    Route::get('/experts/{id}/availability', [ExpertController::class, 'availability']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/experts/{id}/review', [ExpertController::class, 'storeReview']);
    });
});
