<?php

namespace Tests\Feature\Learn;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\Enrollment;
use Modules\Learn\Entities\Quiz;
use Modules\Learn\Entities\QuizAttempt;
use Tests\TestCase;

/**
 * L-B.6 - quiz → completion integration (spec 19: server-side scoring,
 * attempts, pass/fail, completion; spec journey ... Quiz → Complete → Certificate).
 */
class QuizCompletionTest extends TestCase
{
    use RefreshDatabase;

    private function courseWithLessonAndQuiz(array $quizOverrides = []): array
    {
        $course = Course::factory()->create();
        $lesson = CourseLesson::create([
            'course_id' => $course->id,
            'title' => 'Only lesson',
            'lesson_order' => 1,
        ]);
        $quiz = Quiz::create(array_merge([
            'course_id' => $course->id,
            'title' => 'Final check',
            'questions' => [
                ['id' => 'q1', 'question' => 'Pick A', 'options' => ['A', 'B', 'C'], 'correct_index' => 0],
                ['id' => 'q2', 'question' => 'Pick B', 'options' => ['A', 'B', 'C'], 'correct_index' => 1],
            ],
            'pass_score_percent' => 70,
        ], $quizOverrides));

        $user = User::factory()->create();
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'progress' => 0]);

        return compact('course', 'lesson', 'quiz', 'user');
    }

    public function test_text_answers_never_count_as_correct_even_when_the_key_is_zero(): void
    {
        $ctx = $this->courseWithLessonAndQuiz([
            'questions' => [
                ['id' => 'q1', 'question' => 'Is it A?', 'options' => ['Yes', 'No'], 'correct_index' => 0],
            ],
            'pass_score_percent' => 70,
        ]);

        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => 'No']])
            ->assertOk()
            ->assertJsonPath('data.score', 0)
            ->assertJsonPath('data.passed', false);
    }

    public function test_out_of_range_indexes_never_score(): void
    {
        $ctx = $this->courseWithLessonAndQuiz();

        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => '9', 'q2' => '9']])
            ->assertOk()
            ->assertJsonPath('data.score', 0)
            ->assertJsonPath('data.passed', false);

        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => '0', 'q2' => '1']])
            ->assertOk()
            ->assertJsonPath('data.score', 2)
            ->assertJsonPath('data.passed', true);
    }

    public function test_certificate_stays_locked_until_the_quiz_is_passed(): void
    {
        $ctx = $this->courseWithLessonAndQuiz();

        // Lesson done: half of the units.
        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/learn/courses/{$ctx['course']->id}/lessons/{$ctx['lesson']->id}/complete", [])
            ->assertOk();
        $this->assertSame(50, (int) Enrollment::where('user_id', $ctx['user']->id)
            ->where('course_id', $ctx['course']->id)->value('progress'));

        // Wrong answers: still half done, certificate stays locked.
        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => '2', 'q2' => '2']])
            ->assertOk()
            ->assertJsonPath('data.passed', false)
            ->assertJsonPath('data.course_progress.progress', 50);
        $this->assertSame(50, (int) Enrollment::where('user_id', $ctx['user']->id)
            ->where('course_id', $ctx['course']->id)->value('progress'));

        $denied = $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/learn/courses/{$ctx['course']->id}/certificate");
        $denied->assertStatus(422);
        $this->assertStringContainsString('pass 1 more quiz', (string) $denied->json('error'));

        // Passing attempt completes the course and unlocks the certificate.
        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => '0', 'q2' => '1']])
            ->assertOk()
            ->assertJsonPath('data.passed', true)
            ->assertJsonPath('data.course_progress.progress', 100)
            ->assertJsonPath('data.course_progress.course_completed', true);

        $enrollment = Enrollment::where('user_id', $ctx['user']->id)
            ->where('course_id', $ctx['course']->id)->first();
        $this->assertSame(100, (int) $enrollment->progress);
        $this->assertNotNull($enrollment->completed_at);

        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/learn/courses/{$ctx['course']->id}/certificate")
            ->assertStatus(201);
    }

    public function test_failing_attempt_does_not_lower_completed_progress(): void
    {
        $ctx = $this->courseWithLessonAndQuiz();

        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/learn/courses/{$ctx['course']->id}/lessons/{$ctx['lesson']->id}/complete", [])
            ->assertOk();
        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => '0', 'q2' => '1']])
            ->assertJsonPath('data.passed', true);

        // A later failed attempt must not undo the pass nor the completion.
        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => '2', 'q2' => '2']])
            ->assertOk()
            ->assertJsonPath('data.passed', false)
            ->assertJsonPath('data.course_progress.progress', 100)
            ->assertJsonPath('data.course_progress.quizzes_passed', 1);

        $this->assertSame(100, (int) Enrollment::where('user_id', $ctx['user']->id)
            ->where('course_id', $ctx['course']->id)->value('progress'));
    }

    public function test_submitting_without_an_enrollment_records_only_the_attempt(): void
    {
        $ctx = $this->courseWithLessonAndQuiz();
        $outsider = User::factory()->create();

        $this->actingAs($outsider, 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => '0', 'q2' => '1']])
            ->assertOk()
            ->assertJsonPath('data.passed', true)
            ->assertJsonPath('data.course_progress', null);

        $this->assertSame(1, QuizAttempt::where('user_id', $outsider->id)->count());
        $this->assertFalse(
            Enrollment::where('user_id', $outsider->id)->where('course_id', $ctx['course']->id)->exists()
        );
    }

    public function test_course_page_reports_quiz_pass_state_and_certificate_gate(): void
    {
        $ctx = $this->courseWithLessonAndQuiz();

        $this->actingAs($ctx['user'], 'web')
            ->get("/learn/{$ctx['course']->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('learn/Show')
                ->where('quizzes.0.passed', false)
                ->where('certificate_eligible', false));

        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/learn/courses/{$ctx['course']->id}/lessons/{$ctx['lesson']->id}/complete", [])
            ->assertOk();

        $this->actingAs($ctx['user'], 'web')
            ->get("/learn/{$ctx['course']->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('certificate_eligible', false)
                ->where('quizzes.0.passed', false));

        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => '0', 'q2' => '1']])
            ->assertJsonPath('data.passed', true);

        $this->actingAs($ctx['user'], 'web')
            ->get("/learn/{$ctx['course']->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('certificate_eligible', true)
                ->where('quizzes.0.passed', true));
    }

    public function test_quiz_attempt_history_reports_saved_scores(): void
    {
        $ctx = $this->courseWithLessonAndQuiz();

        $this->actingAs($ctx['user'], 'sanctum')
            ->postJson("/api/quizzes/{$ctx['quiz']->id}/submit", ['answers' => ['q1' => '0', 'q2' => '1']])
            ->assertOk();

        $this->actingAs($ctx['user'], 'sanctum')
            ->getJson('/api/learn/quiz-results')
            ->assertOk()
            ->assertJsonPath('data.0.score', 2)
            ->assertJsonPath('data.0.total_questions', 2)
            ->assertJsonPath('data.0.passed', true);
    }
}
