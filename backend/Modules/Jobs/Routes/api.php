<?php

use Illuminate\Support\Facades\Route;
use Modules\Jobs\Http\Controllers\CompanyController;
use Modules\Jobs\Http\Controllers\JobController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/jobs', [JobController::class, 'store']);
        Route::put('/jobs/{id}', [JobController::class, 'update']);
        Route::delete('/jobs/{id}', [JobController::class, 'destroy']);
        Route::post('/jobs/{id}/apply', [JobController::class, 'apply']);
        Route::get('/jobs/{id}/applications', [JobController::class, 'applications']);
        Route::get('/jobs/my-applications', [JobController::class, 'myApplications']);
        Route::get('/jobs/applications/{id}', [JobController::class, 'showApplication']);
        Route::patch('/jobs/applications/{id}', [JobController::class, 'updateApplication']);
        Route::get('/jobs/profile', [JobController::class, 'profile']);

        // N-32 own company profile (one per owner in v1)
        Route::get('/company', [CompanyController::class, 'showOwn']);
        Route::post('/company', [CompanyController::class, 'store']);
        Route::put('/company', [CompanyController::class, 'update']);
        Route::delete('/company', [CompanyController::class, 'destroy']);
    });

    // Public reads
    Route::get('/jobs', [JobController::class, 'index']);
    Route::get('/jobs/search', [JobController::class, 'index']);
    // N-32 public company page (before /jobs/{id} is irrelevant — other prefix)
    Route::get('/companies/{slug}', [CompanyController::class, 'publicProfile']);

    // Admin console (all posts incl. inactive/expired)
    Route::get('/admin/jobs', [JobController::class, 'adminIndex'])
        ->middleware('permission:jobs.overview.view');
    Route::put('/admin/jobs/{id}', [JobController::class, 'adminUpdate'])
        ->middleware('permission:jobs.overview.manage');
    Route::delete('/admin/jobs/{id}', [JobController::class, 'adminDestroy'])
        ->middleware('permission:jobs.overview.manage');
    Route::get('/admin/job-applications', [JobController::class, 'adminApplications'])
        ->middleware('permission:jobs.applications.view');
    Route::get('/jobs/{id}', [JobController::class, 'show']);
});
