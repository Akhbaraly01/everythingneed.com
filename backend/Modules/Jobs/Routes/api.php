<?php

use Illuminate\Support\Facades\Route;
use Modules\Jobs\Http\Controllers\JobController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/jobs', [JobController::class, 'store']);
        Route::put('/jobs/{id}', [JobController::class, 'update']);
        Route::delete('/jobs/{id}', [JobController::class, 'destroy']);
        Route::post('/jobs/{id}/apply', [JobController::class, 'apply']);
        Route::get('/jobs/{id}/applications', [JobController::class, 'applications']);
        Route::get('/jobs/my-applications', [JobController::class, 'myApplications']);
    });

    // Public reads
    Route::get('/jobs', [JobController::class, 'index']);
    Route::get('/jobs/search', [JobController::class, 'index']);
    Route::get('/jobs/{id}', [JobController::class, 'show']);
});
