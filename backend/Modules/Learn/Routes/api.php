<?php

use Illuminate\Support\Facades\Route;
use Modules\Learn\Http\Controllers\CourseController;
use Modules\Learn\Http\Controllers\LearnModerationController;
use Modules\Learn\Http\Controllers\LearnPlaylistController;
use Modules\Learn\Http\Controllers\LearnPostController;
use Modules\Learn\Http\Controllers\LessonProgressController;
use Modules\Learn\Http\Controllers\QuizController;

// Review tiers are pinned inline per route:
//   review (queue/claim/approve/reject/needs-info/hide/restore/reports):
//     super_admin, administrator, learning_admin, learning_reviewer, moderator
//   senior (reassign/pin/course create): super_admin, administrator, learning_admin

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
        Route::get('/learn/certificates/{id}',
            [LessonProgressController::class, 'showCertificate']);
        Route::get('/learn/certificates/{id}/download',
            [LessonProgressController::class, 'downloadCertificate']);

        // Lesson notes (spec 18; owner-scoped)
        Route::get('/learn/lessons/{lessonId}/notes',
            [LessonProgressController::class, 'note']);
        Route::post('/learn/lessons/{lessonId}/notes',
            [LessonProgressController::class, 'saveNote']);

        // Quizzes (graded server-side; answers never exposed pre-submit)
        Route::get('/quizzes/{id}', [QuizController::class, 'show']);
        Route::post('/quizzes/{id}/submit', [QuizController::class, 'submit'])
            ->middleware('throttle:30,1');

        // Knowledge feed: submit -> moderation -> publish.
        Route::post('/learn/posts', [LearnPostController::class, 'store']);
        Route::get('/learn/posts-mine', [LearnPostController::class, 'mine']);
        Route::patch('/learn/posts/{id}', [LearnPostController::class, 'update']);
        Route::delete('/learn/posts/{id}', [LearnPostController::class, 'destroy']);
        Route::post('/learn/posts/{id}/like', [LearnPostController::class, 'toggleLike']);
        Route::post('/learn/posts/{id}/save', [LearnPostController::class, 'toggleSave']);
        Route::post('/learn/posts/{id}/report', [LearnPostController::class, 'report'])
            ->middleware('throttle:10,1');
        Route::post('/learn/posts/{id}/view-heartbeat', [LearnPostController::class, 'heartbeat'])
            ->middleware('throttle:60,1');
        Route::post('/learn/posts/{id}/share', [LearnPostController::class, 'share']);
        Route::post('/learn/posts/{id}/appeal', [LearnPostController::class, 'appeal']);
        Route::post('/learn/posts/{id}/comments', [LearnPostController::class, 'storeComment']);
        Route::post('/learn/comments/{commentId}/like', [LearnPostController::class, 'toggleCommentLike']);

        Route::get('/learn/saved', [LearnPostController::class, 'saved']);
        Route::post('/learn/creators/{userId}/follow', [LearnPostController::class, 'toggleFollow']);

        // Playlists (owner-scoped collections)
        Route::get('/learn/playlists', [LearnPlaylistController::class, 'index']);
        Route::post('/learn/playlists', [LearnPlaylistController::class, 'store']);
        Route::get('/learn/playlists/{id}', [LearnPlaylistController::class, 'show']);
        Route::post('/learn/playlists/{id}/items', [LearnPlaylistController::class, 'storeItem']);
        Route::delete('/learn/playlists/{id}/items/{postId}', [LearnPlaylistController::class, 'destroyItem']);
        Route::delete('/learn/playlists/{id}', [LearnPlaylistController::class, 'destroy']);

        // Feed moderation queue (review tier).
        // Spec 2682: never rely on role names alone - every admin route
        // carries BOTH the role gate and the granular learn.* permission
        // (super_admin holds '*' implicitly; see PermissionSeeder::MATRIX).
        Route::get('/learn/posts-queue', [LearnModerationController::class, 'queue'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');
        Route::post('/learn/posts/{id}/claim', [LearnModerationController::class, 'claim'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');
        Route::post('/learn/posts/{id}/approve', [LearnModerationController::class, 'approve'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');
        Route::post('/learn/posts/{id}/reject', [LearnModerationController::class, 'reject'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');
        Route::post('/learn/posts/{id}/needs-info', [LearnModerationController::class, 'needsInfo'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');
        Route::post('/learn/posts/{id}/hide', [LearnModerationController::class, 'hide'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');
        Route::post('/learn/posts/{id}/restore', [LearnModerationController::class, 'restore'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');
        Route::post('/learn/posts/{id}/remove', [LearnModerationController::class, 'remove'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');

        // Senior tier only.
        Route::post('/learn/posts/{id}/reassign', [LearnModerationController::class, 'reassign'])
            ->middleware('role:super_admin,administrator,learning_admin')
            ->middleware('permission:learn.courses.manage');
        Route::post('/learn/posts/{id}/pin', [LearnModerationController::class, 'pin'])
            ->middleware('role:super_admin,administrator,learning_admin')
            ->middleware('permission:learn.courses.manage');

        // Report inbox (review tier).
        Route::get('/learn/reports', [LearnModerationController::class, 'reports'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');
        Route::post('/learn/reports/{reportId}/resolve', [LearnModerationController::class, 'resolveReport'])
            ->middleware('role:super_admin,administrator,learning_admin,learning_reviewer,moderator')
            ->middleware('permission:learn.posts.review');
    });

    // Public reads
    Route::get('/courses', [CourseController::class, 'index']);

    // Knowledge feed (phase 16 + Learn 2.0): public sees approved only.
    Route::get('/learn/posts', [LearnPostController::class, 'index']);
    Route::get('/learn/posts/{id}', [LearnPostController::class, 'show']);
    Route::get('/learn/posts/{id}/comments', [LearnPostController::class, 'comments']);
    Route::get('/learn/creators/{userId}', [LearnPostController::class, 'creator']);
    Route::get('/course-categories', [CourseController::class, 'categories']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);

        // Admin console: create courses (spec 47 — live everywhere immediately)
        Route::post('/admin/courses', [CourseController::class, 'adminStore'])
            ->middleware('role:super_admin,administrator,learning_admin')
            ->middleware('permission:learn.courses.create');

        // Admin console: course lifecycle (L-B) - list (all statuses), edit,
        // publish/unpublish/archive, soft delete. Role + permission both.
        Route::get('/admin/courses', [CourseController::class, 'adminIndex'])
            ->middleware('role:super_admin,administrator,learning_admin')
            ->middleware('permission:learn.courses.manage');
        Route::put('/admin/courses/{id}', [CourseController::class, 'adminUpdate'])
            ->middleware('role:super_admin,administrator,learning_admin')
            ->middleware('permission:learn.courses.manage');
        Route::put('/admin/courses/{id}/status', [CourseController::class, 'adminStatus'])
            ->middleware('role:super_admin,administrator,learning_admin')
            ->middleware('permission:learn.courses.manage');
        Route::delete('/admin/courses/{id}', [CourseController::class, 'adminDestroy'])
            ->middleware('role:super_admin,administrator,learning_admin')
            ->middleware('permission:learn.courses.manage');
    Route::get('/learn/instructors', [CourseController::class, 'instructors']);
    Route::get('/learn/instructors/{id}', [CourseController::class, 'instructor']);
    Route::get('/learn/certificates/verify/{code}', [LessonProgressController::class, 'verifyCertificate']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/learn/quiz-results', [QuizController::class, 'myResults']);
    });
});
