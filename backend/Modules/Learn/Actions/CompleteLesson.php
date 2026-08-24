<?php

namespace Modules\Learn\Actions;

use Modules\Learn\Entities\Enrollment;
use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\VideoProgress;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;
use Illuminate\Support\Carbon;

class CompleteLesson
{
    public function execute(string $userId, string $courseId, string $lessonId, array $data = []): object
    {
        $enrollment = Enrollment::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        if (!$enrollment) {
            throw new NotFoundException('Enrollment');
        }

        $lesson = CourseLesson::where('id', $lessonId)
            ->where('course_id', $courseId)
            ->first();

        if (!$lesson) {
            throw new NotFoundException('Lesson', $lessonId);
        }

        VideoProgress::updateOrCreate(
            [
                'user_id' => $userId,
                'lesson_id' => $lessonId,
            ],
            [
                'completed' => true,
                'watch_time_seconds' => $data['watch_time_seconds'] ?? 0,
                'progress_percent' => 100,
            ]
        );

        $totalLessons = CourseLesson::where('course_id', $courseId)->count();
        $completedLessons = VideoProgress::where('user_id', $userId)
            ->whereHas('lesson', fn ($q) => $q->where('course_id', $courseId))
            ->where('completed', true)
            ->count();

        $progress = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

        $enrollment->update([
            'progress' => $progress,
            'completed_at' => $progress === 100 ? Carbon::now() : null,
        ]);

        return $enrollment->fresh();
    }
}
