<?php

namespace Modules\Analytics\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Analytics\Http\Controllers\AnalyticsController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/analytics/events', [AnalyticsController::class, 'index']);
        Route::post('/analytics/events', [AnalyticsController::class, 'store']);
        // Personal stats for the customer "My Analytics" page — own data only,
        // so no admin permission is required (auth only).
        Route::get('/analytics/my-summary', [AnalyticsController::class, 'mySummary']);
        Route::get('/analytics/summary', [AnalyticsController::class, 'summary'])
            ->middleware('permission:analytics.overview.view');
    });
});
