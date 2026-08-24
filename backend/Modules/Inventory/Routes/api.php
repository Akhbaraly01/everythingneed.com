<?php

use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\StockController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/stock', [StockController::class, 'index']);
    Route::post('/stock/adjust', [StockController::class, 'adjust']);
    Route::get('/stock-movements', [StockController::class, 'movements']);
    Route::get('/stock/{id}', [StockController::class, 'show']);
    Route::put('/stock/{id}', [StockController::class, 'update']);
    Route::get('/stock/{id}/movements', [StockController::class, 'productMovements']);
});
