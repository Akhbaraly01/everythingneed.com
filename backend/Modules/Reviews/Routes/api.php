<?php

use Illuminate\Support\Facades\Route;
use Modules\Reviews\Http\Controllers\ReviewController;
use Modules\Reviews\Http\Controllers\ReviewModerationController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/reviews', [ReviewController::class, 'store'])
            ->middleware('throttle:30,1');
        Route::post('/reviews/{id}/report', [ReviewController::class, 'report'])
            ->middleware('throttle:30,1');
        Route::post('/reviews/{id}/respond', [ReviewController::class, 'respond'])
            ->middleware('throttle:30,1');
        Route::put('/reviews/{id}', [ReviewController::class, 'update'])
            ->middleware('throttle:30,1');
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy'])
            ->middleware('throttle:30,1');
        Route::post('/reviews/{id}/vote', [ReviewController::class, 'vote'])
            ->middleware('throttle:60,1');
        Route::get('/reviews/mine', [ReviewController::class, 'mine']);
    });

    // Moderation console (L-B.5): list every status + transition rows.
    // super_admin holds '*' implicitly; administrator has reviews.* and
    // moderator holds reviews.reviews.moderate (PermissionSeeder::MATRIX).
    Route::middleware(['role:super_admin,administrator,moderator', 'permission:reviews.reviews.moderate'])
        ->group(function () {
            Route::get('/admin/reviews', [ReviewModerationController::class, 'index']);
            Route::get('/admin/reviews/reports', [ReviewModerationController::class, 'reports']);
            Route::post('/admin/reviews/reports/{id}/decide', [ReviewModerationController::class, 'decideReport'])
                ->middleware('throttle:60,1');
            Route::post('/admin/reviews/{id}/status', [ReviewModerationController::class, 'status'])
                ->middleware('throttle:60,1');
            // Expert reviews live in their own table: same console gate.
            Route::get('/admin/expert-reviews', [ReviewModerationController::class, 'expertIndex']);
            Route::delete('/admin/expert-reviews/{id}', [ReviewModerationController::class, 'destroyExpertReview'])
                ->middleware('throttle:60,1');
        });

    // Public read
    Route::get('/reviews', [ReviewController::class, 'index']);
});
