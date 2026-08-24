<?php

namespace Modules\Upload\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Upload\Http\Controllers\UploadController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/upload', [UploadController::class, 'store']);
        Route::delete('/upload', [UploadController::class, 'destroy']);
    });
});
