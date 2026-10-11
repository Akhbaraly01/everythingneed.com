<?php

namespace Tests\Feature\Learn;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Learn\Actions\IssueCertificate;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\Enrollment;
use Tests\TestCase;

/**
 * W12: public certificate verification.
 *
 * A certificate issued through the real issuance action verifies by its
 * public code (name, course, number); unknown codes 404 instead of
 * leaking anything.
 */
class LearnCertificateVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function completedEnrollment(): array
    {
        $user = $this->createUser();
        $course = Course::create([
            'title' => 'Verification Course',
            'slug' => 'verification-course',
            'description' => 'Fixture',
            'category' => 'programming',
            'price' => 0,
            'instructor_name' => 'Demo Instructor',
            'is_active' => true,
        ]);
        Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'progress' => 100,
            'completed_at' => now(),
        ]);
        $certificate = app(IssueCertificate::class)->execute($user->id, $course->id);

        return [$user, $certificate];
    }

    public function test_issued_certificate_verifies_by_public_code(): void
    {
        [$user, $certificate] = $this->completedEnrollment();

        $this->getJson("/api/learn/certificates/verify/{$certificate->certificate_number}")
            ->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.certificate_number', $certificate->certificate_number)
            ->assertJsonPath('data.course_title', 'Verification Course')
            ->assertJsonPath('data.holder_name', $user->name);
    }

    public function test_unknown_certificate_code_returns_not_found(): void
    {
        $this->getJson('/api/learn/certificates/verify/CERT-NOSUCHCODE')
            ->assertNotFound()
            ->assertJsonPath('data.valid', false);
    }
}
