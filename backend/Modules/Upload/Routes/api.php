<?php

namespace Modules\Upload\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Upload\Http\Controllers\UploadController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/upload', [UploadController::class, 'store'])->middleware('throttle:10,1');
        Route::delete('/upload', [UploadController::class, 'destroy'])->middleware('throttle:30,1');
    });
});
