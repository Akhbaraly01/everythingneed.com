<?php

use Illuminate\Support\Facades\Route;
use Modules\Learn\Http\Controllers\CourseController;
use Modules\Learn\Http\Controllers\LessonProgressController;
use Modules\Learn\Http\Controllers\QuizController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/courses/{id}/enroll', [CourseController::class, 'enroll']);
        Route::get('/my-courses', [CourseController::class, 'myCourses']);

        // Lesson completion → recomputes enrollment progress server-side
        Route::post('/learn/courses/{courseId}/lessons/{lessonId}/complete',
            [LessonProgressController::class, 'complete']);

        // Certificates — issued only after verified 100% progress
        Route::post('/learn/courses/{courseId}/certificate',
            [LessonProgressController::class, 'issueCertificate']);
        Route::get('/learn/my-certificates',
            [LessonProgressController::class, 'myCertificates']);

        // Quizzes (graded server-side; answers never exposed pre-submit)
        Route::get('/quizzes/{id}', [QuizController::class, 'show']);
        Route::post('/quizzes/{id}/submit', [QuizController::class, 'submit'])
            ->middleware('throttle:30,1');
    });

    // Public reads
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/course-categories', [CourseController::class, 'categories']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
});
