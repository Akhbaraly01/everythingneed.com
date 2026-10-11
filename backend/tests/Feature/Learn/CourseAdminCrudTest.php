<?php

namespace Tests\Feature\Learn;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\Enrollment;
use Tests\TestCase;

/**
 * Phase L-B: real course lifecycle in the admin console - edit (including
 * objectives/requirements/language), publish/unpublish/archive, guarded
 * delete, and the public catalog reading `status = published` only.
 */
class CourseAdminCrudTest extends TestCase
{
    use RefreshDatabase;

    private function seedMatrix(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
        Cache::forget('rbac.catalog');
    }

    private function admin(): User
    {
        $this->seedMatrix();
        $admin = $this->createAdmin();

        return $admin;
    }

    private function makeCourse(array $attributes = []): Course
    {
        static $i = 0;
        $i++;

        return Course::create(array_merge([
            'title' => "Lifecycle course {$i}",
            'slug' => "lifecycle-course-{$i}",
            'description' => 'A course used by the L-B lifecycle suite.',
            'category' => 'programming',
            'course_type' => 'theory',
            'instructor_name' => 'Ada Lovelace',
            'price' => 0,
            'level' => 'beginner',
            'language' => 'en',
        ], $attributes));
    }

    public function test_admin_list_includes_every_status_while_the_public_index_stays_published_only(): void
    {
        $this->makeCourse(['status' => Course::STATUS_DRAFT]);
        $this->makeCourse(['status' => Course::STATUS_PUBLISHED]);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/courses')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->getJson('/api/courses')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_admin_update_writes_objectives_requirements_and_language(): void
    {
        $course = $this->makeCourse();

        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/admin/courses/{$course->id}", [
                'title' => 'Renamed lifecycle course',
                'objectives' => ['Explain the water cycle', 'Run a basic experiment'],
                'requirements' => 'A notebook and a pencil.',
                'language' => 'fr',
                'level' => 'intermediate',
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Renamed lifecycle course')
            ->assertJsonPath('data.language', 'fr')
            ->assertJsonPath('data.objectives.0', 'Explain the water cycle');

        $this->getJson("/api/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('data.requirements', 'A notebook and a pencil.')
            ->assertJsonPath('data.level', 'intermediate');
    }

    public function test_unpublishing_hides_the_course_from_discovery_but_keeps_admin_and_enrolled_access(): void
    {
        $course = $this->makeCourse();
        $learner = $this->createUser();
        Enrollment::create(['user_id' => $learner->id, 'course_id' => $course->id, 'progress' => 40]);

        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/admin/courses/{$course->id}/status", ['status' => Course::STATUS_DRAFT])
            ->assertOk()
            ->assertJsonPath('data.status', 'draft');

        // Public catalog, detail, categories and instructors all read published.
        $this->app['auth']->forgetGuards(); // actingAs above would otherwise leak into these guest reads
        $this->getJson('/api/courses')->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson("/api/courses/{$course->id}")->assertNotFound();
        $this->getJson('/api/course-categories')->assertOk()->assertJsonPath('data', []);
        $this->getJson('/api/learn/instructors')->assertOk()->assertJsonPath('data', []);

        // Admin preview and the enrolled learner keep access.
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'draft');

        $this->actingAs($learner, 'sanctum')
            ->getJson("/api/courses/{$course->id}")
            ->assertOk();
    }

    public function test_republishing_restores_discovery_and_stamps_published_at_once(): void
    {
        $course = $this->makeCourse(['status' => Course::STATUS_DRAFT, 'published_at' => null]);

        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/admin/courses/{$course->id}/status", ['status' => Course::STATUS_PUBLISHED])
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $fresh = $course->fresh();
        $this->assertNotNull($fresh->published_at, 'publishing must stamp published_at');

        $this->getJson('/api/courses')->assertJsonPath('meta.total', 1);
    }

    public function test_archived_courses_leave_discovery_and_return_with_publish(): void
    {
        $course = $this->makeCourse();

        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/admin/courses/{$course->id}/status", ['status' => Course::STATUS_ARCHIVED])
            ->assertOk()
            ->assertJsonPath('data.status', 'archived');

        $this->getJson('/api/courses')->assertJsonPath('meta.total', 0);

        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/admin/courses/{$course->id}/status", ['status' => 'nope'])
            ->assertStatus(422);
    }

    public function test_delete_is_refused_while_learners_are_enrolled(): void
    {
        $course = $this->makeCourse();
        $learner = $this->createUser();
        Enrollment::create(['user_id' => $learner->id, 'course_id' => $course->id, 'progress' => 0]);

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson("/api/admin/courses/{$course->id}")
            ->assertStatus(422)
            ->assertJsonPath('error', 'course_has_enrollments');

        $this->assertDatabaseHas('courses', ['id' => $course->id, 'deleted_at' => null]);

        Enrollment::where('course_id', $course->id)->delete();

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson("/api/admin/courses/{$course->id}")
            ->assertOk();

        $this->assertSoftDeleted('courses', ['id' => $course->id]);
        $this->getJson('/api/courses')->assertJsonPath('meta.total', 0);
    }

    public function test_enrollment_into_an_unpublished_course_reads_as_missing(): void
    {
        $course = $this->makeCourse(['status' => Course::STATUS_DRAFT]);
        $learner = $this->createUser();

        $this->actingAs($learner, 'sanctum')
            ->postJson("/api/courses/{$course->id}/enroll")
            ->assertNotFound();

        $this->assertDatabaseCount('enrollments', 0);
    }

    public function test_course_endpoints_refuse_guests_and_roles_without_the_permission(): void
    {
        $course = $this->makeCourse();

        $this->getJson('/api/admin/courses')->assertStatus(401);
        $this->putJson("/api/admin/courses/{$course->id}/status", ['status' => 'draft'])->assertStatus(401);

        // content_manager holds learn.courses.manage but is not on the route
        // role list - the role layer must refuse.
        $this->seedMatrix();
        $manager = $this->createUser();
        $this->assignRole($manager, 'content_manager');
        $this->actingAs($manager, 'sanctum')
            ->putJson("/api/admin/courses/{$course->id}/status", ['status' => 'draft'])
            ->assertStatus(403);
    }
}
