<?php

namespace Tests\Feature\WaveL;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\Enrollment;
use Modules\Learn\Entities\Quiz;
use Tests\TestCase;

class WaveLLearnTest extends TestCase
{
    use RefreshDatabase;

    private function makeCourse(array $overrides = []): Course
    {
        return Course::factory()->create($overrides);
    }

    public function test_quiz_submit_never_reveals_the_answer_key(): void
    {
        $user = User::factory()->create();
        $quiz = Quiz::create([
            'title' => 'Leak check',
            'questions' => [
                ['id' => 'q1', 'question' => '2+2?', 'options' => ['3', '4'], 'correct_index' => 1],
            ],
            'pass_score_percent' => 70,
        ]);

        $res = $this->actingAs($user)->postJson("/api/quizzes/{$quiz->id}/submit", [
            'answers' => ['q1' => '1'],
        ])->assertStatus(200);

        $body = $res->getContent();
        $this->assertStringNotContainsString('correct_index', $body);
        $this->assertStringNotContainsString('correct_answers', $body);
        $this->assertEquals(1, $res->json('data.score'));
        $this->assertTrue($res->json('data.passed'));
    }

    public function test_canonical_course_url_redirects_and_per_quiz_pages_render(): void
    {
        $course = $this->makeCourse();
        $quiz = Quiz::create([
            'course_id' => $course->id,
            'title' => 'First quiz',
            'questions' => [],
            'pass_score_percent' => 70,
        ]);

        $redirect = $this->get("/learn/courses/{$course->id}");
        $redirect->assertStatus(301);
        $this->assertStringEndsWith("/learn/{$course->id}", (string) $redirect->headers->get('Location'));

        $user = $this->createUser();
        $this->actingAs($user, 'web')
            ->get("/learn/courses/{$course->id}/quiz/{$quiz->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('learn/Quiz'));

        $this->actingAs($user, 'web')
            ->get("/learn/courses/{$course->id}/quiz/00000000-0000-0000-0000-000000000000")
            ->assertStatus(302);
    }

    public function test_learn_spec_pages_render(): void
    {
        $user = $this->createUser();
        $course = $this->makeCourse(['category' => 'programming']);

        // Public pages render for guests.
        foreach ([
            '/learn/categories',
            '/learn/categories/programming',
            '/learn/instructors',
            '/learn/search',
            '/certificates/verify/CERT-NOPE',
        ] as $path) {
            $this->get($path)->assertOk();
        }

        // Auth pages redirect guests, render for users.
        foreach (['/learn/progress'] as $path) {
            $this->get($path)->assertRedirect(route('login'));
            $this->actingAs($user, 'web')->get($path)->assertOk();
        }

        // Course page carries the Wave L detail props.
        $this->get("/learn/{$course->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('learn/Show')
                ->has('quizzes')
                ->has('certificate_eligible'));
    }

    public function test_certificate_verify_download_and_detail_are_scoped(): void
    {
        $student = User::factory()->create();
        $stranger = User::factory()->create();
        $course = $this->makeCourse();
        $lesson = CourseLesson::create(['course_id' => $course->id, 'title' => 'Only', 'lesson_order' => 1]);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'progress' => 0]);

        $this->actingAs($student)->postJson(
            "/api/learn/courses/{$course->id}/lessons/{$lesson->id}/complete", []
        )->assertOk();

        $issue = $this->actingAs($student)->postJson(
            "/api/learn/courses/{$course->id}/certificate", []
        )->assertStatus(201);
        $certId = $issue->json('data.id');
        $code = $issue->json('data.certificate_number');
        $this->assertStringStartsWith('CERT-', $code);

        // Public verification works without an account.
        $this->getJson("/api/learn/certificates/verify/{$code}")
            ->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.course_title', $course->title);
        $this->getJson('/api/learn/certificates/verify/CERT-NOPE')->assertStatus(404);
        $this->get("/certificates/verify/{$code}")->assertOk();

        // Detail + download are owner-scoped.
        $this->actingAs($student)->getJson("/api/learn/certificates/{$certId}")->assertOk();
        $this->actingAs($stranger)->getJson("/api/learn/certificates/{$certId}")->assertStatus(404);

        $download = $this->actingAs($student)->get("/api/learn/certificates/{$certId}/download");
        $download->assertOk();
        $this->assertStringContainsString('attachment', $download->headers->get('Content-Disposition'));
        $this->assertStringContainsString($code, $download->getContent());

        $this->actingAs($student, 'web')->get("/learn/certificates/{$certId}")->assertOk();
    }

    public function test_lesson_notes_are_owner_scoped(): void
    {
        $student = User::factory()->create();
        $stranger = User::factory()->create();
        $course = $this->makeCourse();
        $lesson = CourseLesson::create(['course_id' => $course->id, 'title' => 'Notes', 'lesson_order' => 1]);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'progress' => 0]);

        $this->postJson("/api/learn/lessons/{$lesson->id}/notes", ['body' => 'x'])->assertStatus(401);

        $this->actingAs($student)->postJson("/api/learn/lessons/{$lesson->id}/notes", [
            'body' => 'Remember the chain rule',
        ])->assertOk()->assertJsonPath('data.body', 'Remember the chain rule');

        $this->actingAs($student)->getJson("/api/learn/lessons/{$lesson->id}/notes")
            ->assertOk()->assertJsonPath('data.body', 'Remember the chain rule');

        // Replace, not duplicate.
        $this->actingAs($student)->postJson("/api/learn/lessons/{$lesson->id}/notes", [
            'body' => 'Updated note',
        ])->assertOk();
        $this->assertSame(
            1,
            \Modules\Learn\Entities\LessonNote::where('user_id', $student->id)->count()
        );

        // Another user's note on their own lesson row is invisible here (per-user rows).
        $this->actingAs($stranger)->getJson("/api/learn/lessons/{$lesson->id}/notes")
            ->assertOk()->assertJsonPath('data', null);

        $this->actingAs($student)->postJson('/api/learn/lessons/00000000-0000-0000-0000-000000000000/notes', [
            'body' => 'x',
        ])->assertStatus(404);
    }

    public function test_enrollments_carry_lesson_counts_and_recency(): void
    {
        $student = User::factory()->create();
        $course = $this->makeCourse();
        $lessonA = CourseLesson::create(['course_id' => $course->id, 'title' => 'A', 'lesson_order' => 1]);
        CourseLesson::create(['course_id' => $course->id, 'title' => 'B', 'lesson_order' => 2]);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'progress' => 0]);

        $this->actingAs($student)->postJson(
            "/api/learn/courses/{$course->id}/lessons/{$lessonA->id}/complete", []
        )->assertOk();

        $response = $this->actingAs($student)->getJson('/api/my-courses')->assertOk();
        $row = collect($response->json('data'))->firstWhere('course_id', $course->id);
        $this->assertNotNull($row);
        $this->assertSame(2, $row['lessons_count']);
        $this->assertSame(1, $row['completed_lessons']);
        $this->assertFalse((bool) $row['is_completed']);

        $this->assertNotNull(
            Enrollment::where('user_id', $student->id)->value('last_active_at')
        );
    }

    public function test_course_sorting_and_new_detail_columns(): void
    {
        Course::factory()->create(['title' => 'Popular Course', 'students_count' => 500, 'is_featured' => false]);
        Course::factory()->create(['title' => 'Featured Course', 'students_count' => 5, 'is_featured' => true]);
        $leveled = $this->makeCourse([
            'level' => 'beginner',
            'objectives' => ['Ship code', 'Write tests'],
            'language' => 'en',
        ]);

        $popular = $this->getJson('/api/courses?sort=popular&per_page=50')->assertOk();
        $this->assertSame('Popular Course', $popular->json('data.0.title'));

        $featured = $this->getJson('/api/courses?sort=featured&per_page=50')->assertOk();
        $this->assertSame('Featured Course', $featured->json('data.0.title'));

        $leveledRow = $this->getJson('/api/courses?level=beginner')->assertOk();
        $this->assertTrue(collect($leveledRow->json('data'))->contains('id', $leveled->id));

        // Detail props reach the course page.
        $this->get("/learn/{$leveled->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('course.level', 'beginner')
                ->where('course.objectives', ['Ship code', 'Write tests']));
    }

    public function test_instructors_and_categories_endpoints(): void
    {
        $this->makeCourse(['instructor_name' => 'Prof. Wave L', 'category' => 'physics']);

        $this->getJson('/api/learn/instructors')
            ->assertOk()
            ->assertJsonFragment(['full_name' => 'Prof. Wave L']);

        $this->getJson('/api/course-categories')
            ->assertOk()
            ->assertJsonFragment(['name' => 'physics']);
    }
}
