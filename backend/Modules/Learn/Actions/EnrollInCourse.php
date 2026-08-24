<?php

namespace Modules\Learn\Actions;

use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\Enrollment;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class EnrollInCourse
{
    public function execute(string $userId, string $courseId): object
    {
        $course = Course::find($courseId);

        if (!$course) {
            throw new NotFoundException('Course', $courseId);
        }

        $existingEnrollment = Enrollment::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        if ($existingEnrollment) {
            throw new ValidationException('User is already enrolled in this course');
        }

        $enrollment = Enrollment::create([
            'user_id' => $userId,
            'course_id' => $courseId,
            'progress' => 0,
        ]);

        $course->increment('students_count');

        return $enrollment->fresh('course');
    }
}
