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
    Route::get('/learn/instructors/{id}', function (string $id) {
        $course = \Modules\Learn\Entities\Course::where('id', $id)->orWhere('instructor_name', 'ilike', "%{$id}%")->first();
        if (!$course) { $user = \App\Models\User::find($id); if ($user) return response()->json(['data' => ['id' => $user->id, 'full_name' => $user->name, 'bio' => 'Instructor', 'avatar_url' => null, 'specialization' => 'General', 'courses_count' => 0, 'students_count' => 0, 'rating' => null]]); return response()->json(['message' => 'Instructor not found'], 404); }
        $count = \Modules\Learn\Entities\Course::where('instructor_name', $course->instructor_name)->count();
        return response()->json(['data' => ['id' => $course->id, 'full_name' => $course->instructor_name, 'bio' => 'Experienced instructor', 'avatar_url' => null, 'specialization' => $course->category, 'courses_count' => $count, 'students_count' => (int) $course->students_count, 'rating' => $course->rating]]);
    });
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/learn/quiz-results', function (\Illuminate\Http\Request $request) {
            $attempts = \Modules\Learn\Entities\QuizAttempt::where('user_id', $request->user()->id)->with('quiz.course:id,title')->orderByDesc('created_at')->get()->map(fn($a) => ['id' => $a->id, 'course_title' => $a->quiz->course->title ?? 'Course', 'score' => $a->score, 'total_questions' => $a->quiz->questions_count ?? 10, 'passed' => $a->passed, 'completed_at' => $a->created_at]);
            return response()->json(['data' => $attempts]);
        });
        Route::get('/learn/my-certificates', [\Modules\Learn\Http\Controllers\LessonProgressController::class, 'myCertificates']);
    });
});
