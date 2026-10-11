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
        // Public discovery only ever lists published courses (L-B lifecycle).
        $query = Course::query()->published();

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        // FE sends `type`; historical filter is `course_type` — accept both.
        $type = $filters['course_type'] ?? $filters['type'] ?? null;
        if (!empty($type)) {
            $query->where('course_type', $type);
        }

        if (!empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        if (!empty($filters['instructor_name'])) {
            $query->where('instructor_name', 'like', "%{$filters['instructor_name']}%");
        }

        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('description', 'ilike', "%{$q}%");
            });
        }

        // Spec 15 rails: featured / popular / latest. Default order untouched.
        $sort = $filters['sort'] ?? null;
        if ($sort === 'popular') {
            $query->orderByDesc('students_count')->orderByDesc('rating');
        } elseif ($sort === 'featured') {
            $query->orderByDesc('is_featured')->orderByDesc('rating');
        } elseif ($sort === 'rating') {
            $query->orderByDesc('rating');
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

        if (!$course || $course->status !== Course::STATUS_PUBLISHED) {
            // Unpublished courses are indistinguishable from missing ones
            // for enrollment (no draft probing through the pay path).
            throw new NotFoundException('Course', $courseId);
        }

        $existingEnrollment = Enrollment::where('course_id', $courseId)
            ->where('user_id', $userId)
            ->first();

        if ($existingEnrollment) {
            throw new ValidationException('Already enrolled in this course');
        }

        $price = round((float) ($course->price ?? 0), 2);

        if ($price > 0) {
            $result = app(\Core\Services\Contracts\PaymentGatewayInterface::class)->charge([
                'order_id' => $courseId,
                'user_id' => $userId,
                'amount' => $price,
                'currency' => \Core\Support\Currencies::default(),
                'method' => 'card',
                'reference' => 'COURSE-ENROLL-'.strtoupper(substr($courseId, 0, 8)).'-'.strtoupper(substr($userId, 0, 8)),
                'idempotency_key' => 'ENROLL-'.$courseId.'-'.$userId,
                'purpose' => 'course_enrollment',
                'metadata' => ['kind' => 'course_enrollment', 'course_id' => $courseId],
            ]);

            if (!($result['success'] ?? false)) {
                throw new ValidationException($result['error'] ?? 'Course payment failed');
            }
        }

        $enrollment = Enrollment::create([
            'course_id' => $courseId,
            'user_id' => $userId,
            'progress' => 0,
        ]);

        $course->increment('students_count');

        return $enrollment->fresh('course');
    }

    public function getUserEnrollments(string $userId): array
    {
        return Enrollment::with(['course'])
            ->where('user_id', $userId)
            ->get()
            ->map(function (Enrollment $enrollment) use ($userId) {
                $courseId = $enrollment->course_id;
                $lessons = \Modules\Learn\Entities\CourseLesson::where('course_id', $courseId)->count();
                $done = \Modules\Learn\Entities\VideoProgress::where('user_id', $userId)
                    ->where('course_id', $courseId)
                    ->where('completed', true)
                    ->count();

                return array_merge($enrollment->toArray(), [
                    'lessons_count' => $lessons,
                    'completed_lessons' => $done,
                    'is_completed' => (int) $enrollment->progress === 100,
                ]);
            })
            ->all();
    }
}
