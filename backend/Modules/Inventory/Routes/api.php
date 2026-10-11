<?php

use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\StockController;

Route::prefix('api')->middleware(['auth:sanctum', 'permission:inventory.stock.view'])->group(function () {
    Route::get('/stock', [StockController::class, 'index']);
    Route::get('/stock-movements', [StockController::class, 'movements']);
    Route::get('/stock/{id}', [StockController::class, 'show']);
    Route::get('/stock/{id}/movements', [StockController::class, 'productMovements']);
});

Route::prefix('api')->middleware(['auth:sanctum', 'permission:inventory.stock.manage'])->group(function () {
    Route::post('/stock/adjust', [StockController::class, 'adjust']);
    Route::put('/stock/{id}', [StockController::class, 'update']);
});
