<?php

use Illuminate\Support\Facades\Route;
use Modules\Healthcare\Http\Controllers\DoctorController;
use Modules\Healthcare\Http\Controllers\AppointmentController;
use Modules\Healthcare\Http\Controllers\HealthContentController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/doctors', [DoctorController::class, 'store'])->middleware('role:super_admin');
        Route::put('/doctors/{id}/availability', [DoctorController::class, 'setAvailability']);

        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
        Route::get('/appointments/{id}/consultation', [AppointmentController::class, 'consultationRecord']);
        Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::post('/appointments/{id}/assign-doctor', [AppointmentController::class, 'assignDoctor'])->middleware('role:super_admin');
        Route::post('/appointments/{id}/complete', [AppointmentController::class, 'complete']);
    });

    // Public reads (single registration — no shadowing)
    Route::get('/doctors', [DoctorController::class, 'index']);
    Route::get('/doctors/{id}/availability', [DoctorController::class, 'availability']);
    Route::get('/doctors/{id}', [DoctorController::class, 'show']);

    // Health education content
    Route::get('/healthcare/videos/{id}', [HealthContentController::class, 'show'])->defaults('type', 'videos');
    Route::get('/healthcare/documents/{id}', [HealthContentController::class, 'show'])->defaults('type', 'documents');
    Route::get('/healthcare/videos', [HealthContentController::class, 'index'])->defaults('type', 'videos');
    Route::get('/healthcare/documents', [HealthContentController::class, 'index'])->defaults('type', 'documents');
    Route::get('/healthcare/categories', [HealthContentController::class, 'index'])->defaults('type', 'categories');
    Route::get('/healthcare/prevention-guides', [HealthContentController::class, 'index'])->defaults('type', 'prevention-guides');
});
