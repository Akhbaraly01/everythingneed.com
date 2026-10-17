<?php

namespace Tests\Feature\Learn;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\CourseLesson;
use Tests\TestCase;

/**
 * Learn admin: lesson management (master directive §10 - course management,
 * lesson management, content review). Curriculum CRUD plus the learner-facing
 * lesson page consuming what admins publish.
 */
class AdminLessonManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
    }

    private function createCourse(array $overrides = []): Course
    {
        return Course::create(array_merge([
            'title' => 'Grafting fruit trees',
            'slug' => 'grafting-fruit-trees',
            'description' => 'Hands-on grafting for smallholders.',
            'category' => 'agriculture',
            'course_type' => 'practical',
            'instructor_name' => 'Jane Mwangi',
            'price' => 1500,
            'status' => Course::STATUS_DRAFT,
            'students_count' => 0,
            'is_featured' => false,
        ], $overrides));
    }

    private function learningAdmin(): User
    {
        $user = $this->createUser();
        $this->assignRole($user, 'learning_admin');

        return $user;
    }

    public function test_learning_admin_manages_lessons_end_to_end(): void
    {
        $course = $this->createCourse();
        $this->actingAs($this->learningAdmin(), 'sanctum');

        // Create: appended to the end of the curriculum automatically.
        $first = $this->postJson("/api/admin/courses/{$course->id}/lessons", [
            'title' => 'Choosing rootstock',
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'duration_minutes' => 12,
            'is_free_preview' => true,
        ])->assertStatus(201)->json('data');

        $second = $this->postJson("/api/admin/courses/{$course->id}/lessons", [
            'title' => 'Whip and tongue cut',
            'content' => 'Step by step.',
        ])->assertStatus(201)->json('data');

        $this->assertSame(1, $first['lesson_order']);
        $this->assertSame(2, $second['lesson_order']);
        $this->assertTrue((bool) $first['is_free_preview']);

        // List returns curriculum order.
        $this->getJson("/api/admin/courses/{$course->id}/lessons")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $first['id'])
            ->assertJsonPath('data.1.id', $second['id']);

        // Update: retitle and move to the top of the curriculum. The lesson
        // that was first shifts down to position 2.
        $this->putJson("/api/admin/courses/{$course->id}/lessons/{$second['id']}", [
            'title' => 'Whip and tongue cut (updated)',
            'lesson_order' => 1,
        ])->assertOk()->assertJsonPath('data.title', 'Whip and tongue cut (updated)');

        $this->getJson("/api/admin/courses/{$course->id}/lessons")
            ->assertOk()
            ->assertJsonPath('data.0.id', $second['id'])
            ->assertJsonPath('data.1.id', $first['id'])
            ->assertJsonPath('data.1.lesson_order', 2);

        // Delete: soft-removed, the other lesson survives.
        $this->deleteJson("/api/admin/courses/{$course->id}/lessons/{$first['id']}")
            ->assertOk();
        $this->assertNull(CourseLesson::find($first['id']));
        $this->assertNotNull(CourseLesson::find($second['id']));
    }

    public function test_lesson_management_is_role_gated(): void
    {
        $course = $this->createCourse();
        $lesson = CourseLesson::create([
            'course_id' => $course->id,
            'title' => 'Intro',
            'lesson_order' => 1,
        ]);

        $plain = $this->createUser();
        $this->actingAs($plain, 'sanctum');

        $this->getJson("/api/admin/courses/{$course->id}/lessons")->assertStatus(403);
        $this->postJson("/api/admin/courses/{$course->id}/lessons", ['title' => 'Nope'])->assertStatus(403);
        $this->putJson("/api/admin/courses/{$course->id}/lessons/{$lesson->id}", ['title' => 'Nope'])->assertStatus(403);
        $this->deleteJson("/api/admin/courses/{$course->id}/lessons/{$lesson->id}")->assertStatus(403);

        // Nothing changed.
        $this->assertSame('Intro', CourseLesson::find($lesson->id)->title);
    }

    public function test_lesson_validation_and_course_scoping(): void
    {
        $course = $this->createCourse();
        $otherCourse = $this->createCourse(['title' => 'Other course', 'slug' => 'other-course']);
        $lesson = CourseLesson::create([
            'course_id' => $otherCourse->id,
            'title' => 'Foreign lesson',
            'lesson_order' => 1,
        ]);

        $this->actingAs($this->learningAdmin(), 'sanctum');

        // Bad video URL rejected.
        $this->postJson("/api/admin/courses/{$course->id}/lessons", [
            'title' => 'Bad video',
            'video_url' => 'not-a-url',
        ])->assertStatus(422)->assertJsonValidationErrors('video_url');

        // Title is required on create.
        $this->postJson("/api/admin/courses/{$course->id}/lessons", [])
            ->assertStatus(422)->assertJsonValidationErrors('title');

        // Unknown course -> 404 (uuid and non-uuid alike).
        $this->getJson('/api/admin/courses/11111111-2222-3333-4444-555555555555/lessons')
            ->assertStatus(404);
        $this->getJson('/api/admin/courses/not-a-uuid/lessons')->assertStatus(404);

        // A lesson that belongs to another course is not reachable through
        // this course's URL - no cross-course writes.
        $this->putJson("/api/admin/courses/{$course->id}/lessons/{$lesson->id}", [
            'title' => 'Hijacked',
        ])->assertStatus(404);
        $this->deleteJson("/api/admin/courses/{$course->id}/lessons/{$lesson->id}")
            ->assertStatus(404);

        $this->assertSame('Foreign lesson', CourseLesson::find($lesson->id)->title);
    }

    public function test_managed_lessons_reach_the_learner_lesson_page(): void
    {
        $course = $this->createCourse(['status' => Course::STATUS_PUBLISHED]);
        $this->actingAs($this->learningAdmin(), 'sanctum');

        $lesson = $this->postJson("/api/admin/courses/{$course->id}/lessons", [
            'title' => 'Choosing rootstock',
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'duration_minutes' => 12,
        ])->assertStatus(201)->json('data');

        // Guests can open published course lessons (free preview model).
        $this->app['auth']->forgetGuards();
        $learner = $this->createUser();
        $this->actingAs($learner);
        $this->get("/learn/courses/{$course->id}/lessons/{$lesson['id']}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('learn/Lesson')
                ->where('lesson.title', 'Choosing rootstock')
                ->where('lesson.video_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
                ->where('course.total_lessons', 1)
            );
    }
}
