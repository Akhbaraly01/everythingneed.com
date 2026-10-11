<?php

use Illuminate\Support\Facades\Route;
use Modules\Categories\Http\Controllers\CategoryController;

Route::prefix('api')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/tree', [CategoryController::class, 'tree']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);

    Route::middleware(['auth:sanctum', 'permission:categories.categories.manage'])->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    });
});
