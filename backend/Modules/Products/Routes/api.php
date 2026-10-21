<?php

use Illuminate\Support\Facades\Route;
use Modules\Products\Http\Controllers\ProductController;

Route::prefix('api')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    // Home infinite feed (Home rebuild) — declared before /products/{id}
    // so "feed" never resolves as a product id.
    Route::get('/home/feed', [ProductController::class, 'homeFeed']);
    // Ranked recommendations for a product (declared before /products/{id}
    // so "related" never resolves as a product id).
    Route::get('/products/{id}/related', [ProductController::class, 'related']);
    Route::get('/products/comparison', [ProductController::class, 'comparison'])
        ->middleware('auth:sanctum');
    Route::get('/products/{id}', [ProductController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/vendor/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::put('/vendor/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    });
});