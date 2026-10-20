<?php

use Illuminate\Support\Facades\Route;
use Modules\JobSeekers\Http\Controllers\AdminWorkerProfileController;
use Modules\JobSeekers\Http\Controllers\AdminWorkRequestController;
use Modules\JobSeekers\Http\Controllers\WorkerProfileController;
use Modules\JobSeekers\Http\Controllers\WorkRequestController;

Route::prefix('api')->group(function () {
    // Authenticated writes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/job-seekers/profile', [WorkerProfileController::class, 'store']);
        Route::put('/job-seekers/profile', [WorkerProfileController::class, 'update']);
        Route::get('/job-seekers/profile/mine', [WorkerProfileController::class, 'myProfile']);

        Route::get('/work-requests', [WorkRequestController::class, 'index']);
        Route::get('/work-requests/incoming', [WorkRequestController::class, 'incoming']);
        Route::post('/work-requests', [WorkRequestController::class, 'store']);
        Route::get('/work-requests/{id}', [WorkRequestController::class, 'show']);
        Route::post('/work-requests/{id}/offers', [WorkRequestController::class, 'submitOffer']);
        Route::post('/work-offers/{offerId}/respond', [WorkRequestController::class, 'respondToOffer']);
        Route::post('/work-requests/{id}/cancel', [WorkRequestController::class, 'cancel']);
        Route::post('/work-requests/{id}/pay', [WorkRequestController::class, 'markPaid']);
        Route::post('/work-requests/{id}/start', [WorkRequestController::class, 'startProgress']);
        Route::post('/work-requests/{id}/complete', [WorkRequestController::class, 'complete']);
        Route::post('/work-requests/{id}/rate', [WorkRequestController::class, 'rate']);
    });

    // Admin console: every profile (incl. unverified/deleted) + moderation.
    Route::prefix('admin')->group(function () {
        Route::get('/job-seekers', [AdminWorkerProfileController::class, 'index'])
            ->middleware('permission:job_seekers.overview.view');
        Route::put('/job-seekers/{id}', [AdminWorkerProfileController::class, 'update'])
            ->middleware('permission:job_seekers.overview.manage');
        Route::delete('/job-seekers/{id}', [AdminWorkerProfileController::class, 'destroy'])
            ->middleware('permission:job_seekers.overview.manage');
        Route::post('/job-seekers/{id}/restore', [AdminWorkerProfileController::class, 'restore'])
            ->middleware('permission:job_seekers.overview.manage');

        Route::get('/work-requests', [AdminWorkRequestController::class, 'index'])
            ->middleware('permission:job_seekers.requests.manage');
    });

    // Public reads
    Route::get('/job-seekers', [WorkerProfileController::class, 'index']);
    Route::get('/job-seekers/categories', [WorkerProfileController::class, 'categories']);
    Route::get('/job-seekers/{id}', [WorkerProfileController::class, 'show']);
});
