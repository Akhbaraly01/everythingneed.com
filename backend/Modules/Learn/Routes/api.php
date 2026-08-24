<?php

use Illuminate\Support\Facades\Route;
use Modules\Learn\Http\Controllers\CourseController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/courses/{id}/enroll', [CourseController::class, 'enroll']);
        Route::get('/my-courses', [CourseController::class, 'myCourses']);
    });

    // Public reads
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/course-categories', [CourseController::class, 'categories']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
});
