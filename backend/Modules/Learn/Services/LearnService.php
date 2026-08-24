<?php

namespace Modules\Learn\Services;

use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\Enrollment;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class LearnService
{
    public function getCourses(array $filters = [], int $page = 1, int $perPage = 15): object
    {
        $query = Course::query();

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['course_type'])) {
            $query->where('course_type', $filters['course_type']);
        }

        if (!empty($filters['instructor_name'])) {
            $query->where('instructor_name', 'like', "%{$filters['instructor_name']}%");
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function getCourse(string $courseId): ?Course
    {
        return Course::with(['lessons'])->find($courseId);
    }

    public function enrollUser(string $courseId, string $userId): Enrollment
    {
        $course = Course::find($courseId);

        if (!$course) {
            throw new NotFoundException('Course', $courseId);
        }

        $existingEnrollment = Enrollment::where('course_id', $courseId)
            ->where('user_id', $userId)
            ->first();

        if ($existingEnrollment) {
            throw new ValidationException('Already enrolled in this course');
        }

        return Enrollment::create([
            'course_id' => $courseId,
            'user_id' => $userId,
        ]);
    }

    public function getUserEnrollments(string $userId): array
    {
        return Enrollment::with(['course'])
            ->where('user_id', $userId)
            ->get()
            ->toArray();
    }
}
