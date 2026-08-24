<?php

namespace Modules\Engagement\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Engagement\Http\Controllers\EngagementController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/wishlist', [EngagementController::class, 'wishlist']);
        Route::post('/wishlist', [EngagementController::class, 'addToWishlist']);
        Route::delete('/wishlist/{id}', [EngagementController::class, 'removeFromWishlist']);
        Route::get('/recently-viewed', [EngagementController::class, 'recentlyViewed']);
        Route::post('/favorites/toggle', [EngagementController::class, 'toggleFavorite']);
    });
});
