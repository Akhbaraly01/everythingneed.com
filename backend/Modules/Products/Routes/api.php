<?php

use Illuminate\Support\Facades\Route;
use Modules\Products\Http\Controllers\ProductController;

Route::prefix('api')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/comparison', function (\Illuminate\Http\Request $request) {
        // Engagement compare is the source of truth
        $ids = \Modules\Engagement\Entities\ProductComparison::where('user_id', $request->user()?->id ?? null)->pluck('product_id');
        $products = \Modules\Products\Entities\Product::whereIn('id', $ids)->get();
        return response()->json(['data' => $products]);
    })->middleware('auth:sanctum');
    Route::get('/products/{id}', [ProductController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/vendor/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::put('/vendor/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    });
});