<?php

namespace Tests\Feature\Learn;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\Enrollment;
use Modules\Learn\Entities\Quiz;
use Tests\TestCase;

class LearnBackendTest extends TestCase
{
    use RefreshDatabase;

    private array $setup = [];

    /**
     * Course with 2 lessons, enrolled student, 1 of 2 lessons already done.
     */
    private function setupCourse(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->create();
        $lessonA = CourseLesson::create([
            'course_id' => $course->id,
            'title' => 'Lesson A',
            'lesson_order' => 1,
        ]);
        $lessonB = CourseLesson::create([
            'course_id' => $course->id,
            'title' => 'Lesson B',
            'lesson_order' => 2,
        ]);
        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'progress' => 0,
        ]);

        // Mark lesson A complete directly (as if previously watched)
        \Modules\Learn\Entities\VideoProgress::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'lesson_id' => $lessonA->id,
            'completed' => true,
            'progress_percent' => 100,
        ]);

        $this->setup = compact('student', 'course', 'lessonA', 'lessonB');
    }

    public function test_completing_final_lesson_reaches_100_percent(): void
    {
        $this->setupCourse();
        ['student' => $student, 'course' => $course, 'lessonB' => $lessonB] = $this->setup;

        $res = $this->actingAs($student)->postJson(
            "/api/learn/courses/{$course->id}/lessons/{$lessonB->id}/complete",
        );

        $res->assertStatus(200);
        $this->assertEquals(100, $res->json('data.progress'));
        $this->assertTrue($res->json('data.course_completed'));
    }

    public function test_certificate_requires_full_completion(): void
    {
        $this->setupCourse();
        ['student' => $student, 'course' => $course] = $this->setup;

        // 50% progress — certificate denied
        $this->actingAs($student)
            ->postJson("/api/learn/courses/{$course->id}/certificate")
            ->assertStatus(422);

        // Complete remaining lesson → certificate issued with CERT number
        $this->actingAs($student)->postJson(
            "/api/learn/courses/{$course->id}/lessons/{$this->setup['lessonB']->id}/complete",
        );

        $cert = $this->actingAs($student)
            ->postJson("/api/learn/courses/{$course->id}/certificate");
        $cert->assertStatus(201);
        $this->assertStringStartsWith('CERT-', $cert->json('data.certificate_number'));

        // Idempotent: same certificate returned, not duplicated
        $again = $this->actingAs($student)
            ->postJson("/api/learn/courses/{$course->id}/certificate");
        $again->assertStatus(201);
        $this->assertEquals($cert->json('data.id'), $again->json('data.id'));
    }

    public function test_certificate_cannot_be_self_issued_via_table_gateway(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/db/user_certificates', [
                'course_title' => 'Hack Course',
                'certificate_number' => 'CERT-FAKE',
            ])
            ->assertStatus(405); // gateway marks the table read-only

        $this->assertDatabaseMissing('user_certificates', [
            'user_id' => $user->id,
        ]);
    }

    public function test_quiz_show_never_exposes_correct_answers(): void
    {
        $quiz = Quiz::create([
            'title' => 'Safety basics',
            'questions' => [
                ['id' => 'q1', 'question' => 'PPE stands for?', 'options' => ['Personal Protective Equipment', 'Power Plant Energy'], 'correct_index' => 0],
                ['id' => 'q2', 'question' => 'Fire exits should be…', 'options' => ['Locked', 'Clear'], 'correct_index' => 1],
            ],
            'pass_score_percent' => 70,
        ]);

        $user = User::factory()->create();
        $res = $this->actingAs($user)->getJson("/api/quizzes/{$quiz->id}");
        $res->assertStatus(200);

        $body = $res->getContent();
        $this->assertStringNotContainsString('correct_index', $body);

        $this->assertEquals(2, $res->json('data.total'));
    }

    public function test_quiz_submit_grades_server_side_and_persists_attempt(): void
    {
        $user = User::factory()->create();
        $quiz = Quiz::create([
            'title' => 'Grading quiz',
            'questions' => [
                ['id' => 'q1', 'question' => '2+2?', 'options' => ['3', '4'], 'correct_index' => 1],
                ['id' => 'q2', 'question' => 'Sky color?', 'options' => ['Blue', 'Red'], 'correct_index' => 0],
            ],
            'pass_score_percent' => 70,
        ]);

        $res = $this->actingAs($user)->postJson("/api/quizzes/{$quiz->id}/submit", [
            'answers' => ['q1' => '1', 'q2' => '1'], // one right, one wrong
        ]);
        $res->assertStatus(200);
        $this->assertEquals(1, $res->json('data.score'));
        $this->assertEquals(2, $res->json('data.total'));
        $this->assertFalse($res->json('data.passed'));

        $attempt = \Modules\Learn\Entities\QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)->first();
        $this->assertNotNull($attempt);
        $this->assertFalse($attempt->passed);
    }
}
