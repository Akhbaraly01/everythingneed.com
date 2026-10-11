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
            'user_id' => $userId,
            'course_id' => $courseId,
            'progress' => 0,
        ]);

        $course->increment('students_count');

        return $enrollment->fresh('course');
    }
}
