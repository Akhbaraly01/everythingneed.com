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
                'course_id' => $courseId,
                'completed' => true,
                'watch_time_seconds' => $data['watch_time_seconds'] ?? 0,
                'progress_percent' => 100,
            ]
        );

        $detail = (new ComputeCourseProgress())->execute($userId, $courseId);

        $enrollment->update([
            'progress' => $detail['progress'],
            'completed_at' => $detail['progress'] === 100 ? Carbon::now() : null,
            'last_active_at' => Carbon::now(),
        ]);

        return $enrollment->fresh();
    }
}
