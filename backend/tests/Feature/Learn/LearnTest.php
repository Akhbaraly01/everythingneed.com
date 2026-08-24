<?php

namespace Tests\Feature\Learn;

use Tests\TestCase;
use App\Models\User;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\Enrollment;

class LearnTest extends TestCase
{
    private function createCourse(array $attributes = []): Course
    {
        return Course::create(array_merge([
            'title' => fake()->words(4, true),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->paragraph(),
            'category' => 'programming',
            'course_type' => 'theory',
            'instructor_name' => fake()->name(),
            'price' => 49.99,
            'duration_hours' => 10.5,
            'students_count' => 0,
            'is_featured' => false,
        ], $attributes));
    }

    public function test_anyone_can_list_courses(): void
    {
        $this->createCourse(['title' => 'Laravel Basics']);

        $response = $this->getJson('/api/courses');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'title', 'category', 'price']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    public function test_user_can_list_courses(): void
    {
        $user = $this->createUser();
        $this->createCourse(['title' => 'PHP Advanced']);
        $this->createCourse(['title' => 'Vue.js Fundamentals']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/courses');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'title', 'category', 'price']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_can_view_a_course(): void
    {
        $user = $this->createUser();
        $course = $this->createCourse(['title' => 'Mastering Docker']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/courses/{$course->id}");

        $response->assertOk()
            ->assertJsonFragment(['title' => 'Mastering Docker']);
    }

    public function test_view_nonexistent_course_returns_404(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/courses/nonexistent-id');

        $response->assertStatus(404)
            ->assertJsonFragment(['message' => 'Course not found']);
    }

    public function test_user_can_enroll_in_course(): void
    {
        $user = $this->createUser();
        $course = $this->createCourse(['title' => 'React for Beginners']);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/courses/{$course->id}/enroll");

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Enrolled successfully']);

        $this->assertDatabaseHas('enrollments', [
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_enroll(): void
    {
        $course = $this->createCourse();

        $response = $this->postJson("/api/courses/{$course->id}/enroll");

        $response->assertStatus(401);
    }

    public function test_user_cannot_enroll_twice_in_same_course(): void
    {
        $user = $this->createUser();
        $course = $this->createCourse();

        $this->actingAs($user, 'sanctum');

        $this->postJson("/api/courses/{$course->id}/enroll")->assertStatus(201);

        $response = $this->postJson("/api/courses/{$course->id}/enroll");

        $response->assertStatus(422);
    }

    public function test_user_can_view_enrolled_courses(): void
    {
        $user = $this->createUser();
        $course1 = $this->createCourse(['title' => 'Course A']);
        $course2 = $this->createCourse(['title' => 'Course B']);

        Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course1->id,
        ]);
        Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course2->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/my-courses');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'user_id', 'course_id']],
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_only_sees_own_enrolled_courses(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();
        $course1 = $this->createCourse(['title' => 'User1 Course']);
        $course2 = $this->createCourse(['title' => 'User2 Course']);

        Enrollment::create(['user_id' => $user1->id, 'course_id' => $course1->id]);
        Enrollment::create(['user_id' => $user2->id, 'course_id' => $course2->id]);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson('/api/my-courses');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_enrollment_record_is_created_with_correct_data(): void
    {
        $user = $this->createUser();
        $course = $this->createCourse();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/courses/{$course->id}/enroll")
            ->assertStatus(201);

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        $this->assertNotNull($enrollment);
        $this->assertEquals(0, $enrollment->progress);
        $this->assertNull($enrollment->completed_at);
    }

    public function test_enrolling_in_nonexistent_course_returns_404(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/courses/nonexistent-id/enroll');

        $response->assertStatus(404);
    }

    public function test_my_courses_returns_empty_when_no_enrollments(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/my-courses');

        $response->assertOk()
            ->assertJsonFragment(['data' => []]);
    }
}
