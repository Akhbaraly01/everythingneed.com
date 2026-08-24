<?php

namespace Modules\Analytics\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Analytics\Http\Controllers\AnalyticsController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/analytics/events', [AnalyticsController::class, 'index']);
        Route::post('/analytics/events', [AnalyticsController::class, 'store']);
        Route::get('/analytics/summary', [AnalyticsController::class, 'summary']);
    });
});
