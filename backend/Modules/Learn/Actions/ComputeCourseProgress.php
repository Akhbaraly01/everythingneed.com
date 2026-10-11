<?php

namespace Modules\Learn\Actions;

use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\Quiz;
use Modules\Learn\Entities\QuizAttempt;
use Modules\Learn\Entities\VideoProgress;

/**
 * One source of truth for "how far through a course is this learner".
 *
 * Spec journey (Browse → Enroll → Lesson → Progress → Quiz → Complete →
 * Certificate): completion covers every lesson AND every quiz, so passing a
 * quiz counts exactly like finishing a lesson.
 */
class ComputeCourseProgress
{
    public function execute(string $userId, string $courseId): array
    {
        $lessonsTotal = CourseLesson::where('course_id', $courseId)->count();
        $lessonsCompleted = VideoProgress::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->where('completed', true)
            ->count();

        $quizIds = Quiz::where('course_id', $courseId)->pluck('id');
        $quizzesTotal = $quizIds->count();
        $quizzesPassed = $quizzesTotal > 0
            ? QuizAttempt::where('user_id', $userId)
                ->whereIn('quiz_id', $quizIds)
                ->where('passed', true)
                ->distinct()
                ->count('quiz_id')
            : 0;

        $units = $lessonsTotal + $quizzesTotal;
        $done = $lessonsCompleted + $quizzesPassed;

        return [
            'progress' => $units > 0 ? (int) round(($done / $units) * 100) : 0,
            'lessons_total' => $lessonsTotal,
            'lessons_completed' => $lessonsCompleted,
            'quizzes_total' => $quizzesTotal,
            'quizzes_passed' => $quizzesPassed,
        ];
    }
}
