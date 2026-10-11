<?php

use Illuminate\Support\Facades\Route;
use Modules\Bills\Http\Controllers\BillsController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/bills/services', [BillsController::class, 'services']);
    Route::post('/bills/purchase', [BillsController::class, 'purchase'])
        ->middleware('throttle:30,1');
    Route::get('/bills/purchases', [BillsController::class, 'index']);
    Route::get('/bills/purchases/{id}', [BillsController::class, 'show']);
});
