<?php

namespace Tests\Feature\Learn;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\Enrollment;
use Tests\TestCase;

/**
 * Phase L-B: the Inertia Learn surfaces (landing rails, course detail,
 * lessons, quizzes) read published courses only, the level filter hits the
 * real `level` column, and draft access is limited to course managers and
 * already-enrolled learners.
 */
class LearnLandingPageTest extends TestCase
{
    use RefreshDatabase;

    private function seedMatrix(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
        Cache::forget('rbac.catalog');
    }

    private function makeCourse(array $attributes = []): Course
    {
        static $i = 0;
        $i++;

        return Course::create(array_merge([
            'title' => "Landing course {$i}",
            'slug' => "landing-course-{$i}",
            'description' => 'Landing page coverage course.',
            'category' => 'programming',
            'course_type' => 'theory',
            'instructor_name' => 'Grace Hopper',
            'price' => 0,
            'level' => 'beginner',
        ], $attributes));
    }

    public function test_landing_rails_and_list_hide_draft_courses(): void
    {
        $published = $this->makeCourse(['is_featured' => true, 'students_count' => 50]);
        $draft = $this->makeCourse(['status' => Course::STATUS_DRAFT, 'is_featured' => true, 'students_count' => 99]);

        $this->get('/learn')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('learn/Index')
                ->where('courses.total', 1)
                ->where('courses.data.0.id', $published->id)
                ->where('featured.0.id', $published->id)
                ->has('popular', 1)
                ->has('latest', 1));
    }

    public function test_draft_course_page_reads_as_not_found_for_guests(): void
    {
        $draft = $this->makeCourse(['status' => Course::STATUS_DRAFT]);

        // House convention: web 404s bounce back with an error flash so
        // Inertia always receives a valid redirect (never a bare HTML 404).
        $this->get("/learn/{$draft->id}")
            ->assertStatus(302)
            ->assertSessionHas('error');
        $this->get("/learn/courses/{$draft->id}")->assertRedirect(route('learn.show', ['id' => $draft->id]));
    }

    public function test_enrolled_learners_keep_access_to_a_course_that_was_unpublished(): void
    {
        $draft = $this->makeCourse(['status' => Course::STATUS_DRAFT]);
        $learner = $this->createUser();
        Enrollment::create(['user_id' => $learner->id, 'course_id' => $draft->id, 'progress' => 30]);

        $this->actingAs($learner)
            ->get("/learn/{$draft->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('learn/Show'));

        $this->app['auth']->forgetGuards();
        $this->seedMatrix();
        $manager = $this->createUser();
        $this->assignRole($manager, 'learning_admin');

        $this->actingAs($manager)
            ->get("/learn/{$draft->id}")
            ->assertOk();
    }

    public function test_level_filter_reads_the_level_column_not_the_course_type(): void
    {
        $beginner = $this->makeCourse(['level' => 'beginner']);
        $this->makeCourse(['level' => 'advanced']);

        $this->get('/learn?level=beginner')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('courses.total', 1)
                ->where('courses.data.0.id', $beginner->id)
                ->where('courses.data.0.level', 'beginner')
                ->where('filters.level', 'beginner'));

        // A course_type value must no longer masquerade as a level.
        $this->get('/learn?level=practical')->assertInertia(
            fn ($page) => $page->where('courses.total', 0)
        );
    }

    public function test_recommendations_and_search_only_see_published_courses(): void
    {
        $this->seedMatrix();
        $admin = $this->createAdmin();

        $enrolledCourse = $this->makeCourse(['category' => 'data-science']);
        $other = $this->makeCourse(['category' => 'data-science', 'rating' => 5, 'level' => 'advanced']);
        $draft = $this->makeCourse([
            'category' => 'data-science',
            'status' => Course::STATUS_DRAFT,
            'rating' => 5,
        ]);

        Enrollment::create(['user_id' => $admin->id, 'course_id' => $enrolledCourse->id, 'progress' => 10]);

        // Same category, not enrolled, published -> recommended. The draft
        // has the same (better) rating and must stay invisible.
        $this->actingAs($admin)
            ->get('/learn')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('recommended.0.id', $other->id)
                ->where('recommended', fn ($items) => count($items) === 1));

        $this->app['auth']->forgetGuards();
        $this->get('/learn?search=Landing+course')
            ->assertInertia(fn ($page) => $page->where('courses.total', 2));

        $this->get('/learn?search=Landing+course&level=advanced')
            ->assertInertia(fn ($page) => $page->where('courses.total', 1));

        $this->assertSame(Course::STATUS_DRAFT, $draft->fresh()->status);
    }

    public function test_learn_pages_carry_honest_seo_metadata(): void
    {
        $course = $this->makeCourse([
            'title' => 'SEO Course Title',
            'description' => 'A course about SEO metadata.',
            'instructor_name' => 'Ada Lovelace',
            'students_count' => 12,
            'rating' => 4.5,
        ]);

        $this->get('/learn')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('learn/Index')
                ->where('seo.title', 'Learn New Skills & Advance Your Career')
                ->where('seo.robots', 'index,follow')
                ->where('seo.canonical', url('/learn')));

        $this->get('/learn?category=programming')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('seo.title', 'Learn: programming'));

        $this->get('/learn/'.$course->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('learn/Show')
                ->where('seo.title', 'SEO Course Title')
                ->where('seo.canonical', route('learn.show', ['id' => $course->id]))
                ->where('seo.robots', 'index,follow')
                ->where('seo.description', fn ($d) => str_contains((string) $d, 'Ada Lovelace')
                    && str_contains((string) $d, '12 students enrolled')
                    && str_contains((string) $d, 'Rated 4.5')));

        $this->get('/learn/categories/programming')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('learn/Category')
                ->where('seo.title', 'Courses in Programming')
                ->where('seo.canonical', route('learn.category', ['slug' => 'programming'])));

        // Unknown instructors are noindexed (honest: nothing to rank).
        $this->get('/learn/instructors/does-not-exist')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('learn/InstructorProfile')
                ->where('seo.robots', 'noindex,follow'));
    }
}
