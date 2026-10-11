<?php

namespace Tests\Feature\Learn;

use App\Models\User;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\Enrollment;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

class LearnHardeningTest extends TestCase
{
    private function createCourse(array $attrs = []): Course
    {
        return Course::create(array_merge([
            'title' => 'Hardening Course',
            'slug' => 'hardening-'.uniqid(),
            'description' => 'Test course',
            'category' => 'programming',
            'course_type' => 'theory',
            'instructor_name' => 'Dr. Learn',
            'price' => 0,
            'duration_hours' => 5,
            'students_count' => 0,
            'is_featured' => false,
        ], $attrs));
    }

    public function test_free_course_enrolls_without_payment(): void
    {
        $user = $this->actingAsUser();
        $course = $this->createCourse(['price' => 0]);

        $before = Payment::count();
        $this->postJson("/api/courses/{$course->id}/enroll")->assertStatus(201);
        $this->assertSame($before, Payment::count());
        $this->assertEquals(1, $course->fresh()->students_count);
    }

    public function test_paid_course_enroll_charges_through_gateway(): void
    {
        $user = $this->actingAsUser();
        $course = $this->createCourse(['price' => 79.99]);

        $before = Payment::count();
        $this->postJson("/api/courses/{$course->id}/enroll")->assertStatus(201);

        $this->assertSame($before + 1, Payment::count());
        $payment = Payment::orderBy('created_at', 'desc')->first();
        $this->assertEquals(79.99, (float) $payment->amount);
        $this->assertEquals('succeeded', $payment->status);
        $this->assertEquals(1, $course->fresh()->students_count);
    }

    public function test_double_enroll_does_not_double_charge(): void
    {
        $user = $this->actingAsUser();
        $course = $this->createCourse(['price' => 40]);

        $this->postJson("/api/courses/{$course->id}/enroll")->assertStatus(201);
        $afterFirst = Payment::count();

        $this->postJson("/api/courses/{$course->id}/enroll")->assertStatus(422);
        $this->assertSame($afterFirst, Payment::count());
        $this->assertEquals(1, $course->fresh()->students_count);
    }

    public function test_course_type_filter_via_type_query_param(): void
    {
        $this->createCourse(['title' => 'Theory One', 'course_type' => 'theory', 'slug' => 't1-'.uniqid()]);
        $this->createCourse(['title' => 'Practical One', 'course_type' => 'practical', 'slug' => 'p1-'.uniqid()]);

        $res = $this->getJson('/api/courses?type=theory');
        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertEquals('Theory One', $res->json('data.0.title'));
    }

    public function test_course_search_q_filter(): void
    {
        $this->createCourse(['title' => 'Docker Deep Dive', 'slug' => 'docker-'.uniqid()]);
        $this->createCourse(['title' => 'Kubernetes Basics', 'slug' => 'k8s-'.uniqid()]);

        $res = $this->getJson('/api/courses?q=Docker');
        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
    }

    public function test_complete_lesson_without_enrollment_404(): void
    {
        $user = $this->actingAsUser();
        $course = $this->createCourse();
        $lesson = CourseLesson::create([
            'course_id' => $course->id,
            'title' => 'L1',
            'lesson_order' => 1,
        ]);

        $this->postJson("/api/learn/courses/{$course->id}/lessons/{$lesson->id}/complete")
            ->assertStatus(404);
    }

    public function test_certificate_requires_enrollment(): void
    {
        $user = $this->actingAsUser();
        $course = $this->createCourse();

        $this->postJson("/api/learn/courses/{$course->id}/certificate")
            ->assertStatus(404);
    }

    public function test_free_enroll_increments_students_count(): void
    {
        $this->actingAsUser();
        $course = $this->createCourse(['price' => 0, 'students_count' => 3]);

        $this->postJson("/api/courses/{$course->id}/enroll")->assertStatus(201);
        $this->assertEquals(4, $course->fresh()->students_count);
    }
}
