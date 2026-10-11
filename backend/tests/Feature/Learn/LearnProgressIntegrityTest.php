<?php

namespace Tests\Feature\Learn;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\Enrollment;
use Modules\Learn\Entities\VideoProgress;
use Tests\TestCase;

/**
 * Phase L-B.1 - completion integrity (spec 230 "never fake progress").
 *
 * Two forgery paths used to be open through the generic table gateway:
 *   1. POST /api/db/enrollments minted an enrollment for a paid course
 *      without LearnService ever charging it;
 *   2. POST/PUT /api/db/video_progress wrote `completed = true`, and
 *      CompleteLesson recounts completed rows into enrollments.progress,
 *      which is exactly what IssueCertificate trusts.
 *
 * Both tables are now read-only through the gateway: enrollment only
 * happens via POST /api/courses/{id}/enroll and progress is recomputed
 * only by CompleteLesson. These tests pin the closed paths and re-prove
 * the legitimate chain still reaches a certificate.
 */
class LearnProgressIntegrityTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{user: User, course: Course, lessonA: CourseLesson, lessonB: CourseLesson} */
    private function enrolledCourse(): array
    {
        $user = User::factory()->create();
        $course = Course::factory()->create(['price' => 0]);
        $lessonA = CourseLesson::create([
            'course_id' => $course->id,
            'title' => 'Integrity A',
            'lesson_order' => 1,
        ]);
        $lessonB = CourseLesson::create([
            'course_id' => $course->id,
            'title' => 'Integrity B',
            'lesson_order' => 2,
        ]);

        $this->actingAs($user)
            ->postJson("/api/courses/{$course->id}/enroll")
            ->assertCreated();

        return compact('user', 'course', 'lessonA', 'lessonB');
    }

    public function test_gateway_cannot_mint_an_enrollment_or_a_completed_video_progress_row(): void
    {
        ['user' => $user, 'course' => $course, 'lessonA' => $lessonA] = $this->enrolledCourse();

        // 1. No enrollment can be created outside the paid enroll endpoint.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/db/enrollments', ['course_id' => $course->id])
            ->assertStatus(405);
        $this->assertSame(
            1,
            Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->count(),
            'the gateway insert must not add a second enrollment'
        );

        // 2. A `completed` video_progress row cannot be written (insert or update).
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/db/video_progress', [
                'course_id' => $course->id,
                'lesson_id' => $lessonA->id,
                'completed' => true,
                'progress_percent' => 100,
            ])
            ->assertStatus(405);

        VideoProgress::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'lesson_id' => $lessonA->id,
            'completed' => false,
            'progress_percent' => 10,
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/db/video_progress/' . VideoProgress::where('user_id', $user->id)->value('id'), [
                'completed' => true,
                'progress_percent' => 100,
            ])
            ->assertStatus(405);

        // 3. Progress therefore stays server-owned: no completion, no certificate.
        $this->assertSame(0, (int) Enrollment::where('user_id', $user->id)->value('progress'));
        $this->actingAs($user)
            ->postJson("/api/learn/courses/{$course->id}/certificate")
            ->assertStatus(422);
    }

    public function test_certificate_still_issues_after_real_lesson_completion(): void
    {
        ['user' => $user, 'course' => $course, 'lessonA' => $lessonA, 'lessonB' => $lessonB] = $this->enrolledCourse();

        $first = $this->actingAs($user)->postJson(
            "/api/learn/courses/{$course->id}/lessons/{$lessonA->id}/complete"
        );
        $first->assertOk();
        $this->assertSame(50, (int) $first->json('data.progress'));
        $this->actingAs($user)
            ->postJson("/api/learn/courses/{$course->id}/certificate")
            ->assertStatus(422);

        $second = $this->actingAs($user)->postJson(
            "/api/learn/courses/{$course->id}/lessons/{$lessonB->id}/complete"
        );
        $second->assertOk();
        $this->assertSame(100, (int) $second->json('data.progress'));
        $this->assertTrue((bool) $second->json('data.course_completed'));

        $certificate = $this->actingAs($user)
            ->postJson("/api/learn/courses/{$course->id}/certificate");
        $certificate->assertStatus(201);
        $this->assertStringStartsWith('CERT-', $certificate->json('data.certificate_number'));
    }
}
