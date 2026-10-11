<?php

namespace Tests\Feature\Learn;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Learn\Entities\Course;
use Tests\TestCase;

/**
 * L-B.7 - instructor surfaces: the directory page (spec 16 /learn/instructors)
 * and the profile (/learn/instructors/{id}) are real destinations that carry
 * the instructor's published catalogue, not just statistics.
 */
class InstructorSurfaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_directory_page_renders_and_lists_instructors_with_counts(): void
    {
        Course::factory()->create(['instructor_name' => 'Ada Directory', 'students_count' => 5]);
        Course::factory()->create(['instructor_name' => 'Ada Directory', 'students_count' => 3]);
        Course::factory()->create(['instructor_name' => 'Ben Directory']);

        $this->get('/learn/instructors')->assertOk()->assertInertia(
            fn ($page) => $page->component('learn/Instructors')
        );

        $res = $this->getJson('/api/learn/instructors')->assertOk();
        $ada = collect($res->json('data'))->firstWhere('full_name', 'Ada Directory');

        $this->assertNotNull($ada);
        $this->assertSame(2, $ada['courses_count']);
        $this->assertSame(8, (int) $ada['students_count']);
    }

    public function test_instructor_profile_carries_published_courses_only(): void
    {
        $live = Course::factory()->create([
            'instructor_name' => 'Prof. Catalogue',
            'title' => 'Live course',
            'students_count' => 7,
        ]);
        Course::factory()->create([
            'instructor_name' => 'Prof. Catalogue',
            'title' => 'Draft course',
            'status' => Course::STATUS_DRAFT,
        ]);
        Course::factory()->create([
            'instructor_name' => 'Someone Else',
            'title' => 'Other course',
        ]);

        $res = $this->getJson('/api/learn/instructors/' . urlencode('Prof. Catalogue'))
            ->assertOk()
            ->assertJsonPath('data.full_name', 'Prof. Catalogue')
            ->assertJsonPath('data.courses_count', 1);

        $courses = collect($res->json('data.courses'));
        $this->assertSame([$live->id], $courses->pluck('id')->all());
        $this->assertSame('Live course', $courses->first()['title']);

        $this->get('/learn/instructors/' . urlencode('Prof. Catalogue'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('learn/InstructorProfile'));
    }

    public function test_unknown_instructor_is_a_404(): void
    {
        $this->getJson('/api/learn/instructors/Nope%20Nobody')->assertStatus(404);
    }
}
