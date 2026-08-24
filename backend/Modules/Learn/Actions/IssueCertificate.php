<?php

namespace Modules\Learn\Actions;

use Modules\Learn\Entities\Enrollment;
use Modules\Learn\Entities\Course;
use Modules\Users\Entities\UserCertificate;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class IssueCertificate
{
    public function execute(string $userId, string $courseId): object
    {
        $enrollment = Enrollment::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        if (!$enrollment) {
            throw new NotFoundException('Enrollment');
        }

        if ($enrollment->progress < 100) {
            throw new ValidationException('Course not yet completed');
        }

        $existingCert = UserCertificate::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        if ($existingCert) {
            return $existingCert;
        }

        $course = Course::find($courseId);

        $certificate = UserCertificate::create([
            'user_id' => $userId,
            'course_id' => $courseId,
            'course_title' => $course->title,
            'instructor_name' => $course->instructor_name,
            'certificate_number' => 'CERT-' . strtoupper(Str::random(10)),
            'issued_at' => Carbon::now(),
        ]);

        return $certificate->fresh();
    }
}
