<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\Learn\Actions\ComputeCourseProgress;
use Modules\Learn\Actions\IssueCertificate;
use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\Enrollment;
use Modules\Learn\Entities\Quiz;
use Modules\Learn\Entities\QuizAttempt;
use Modules\Learn\Entities\VideoProgress;

/**
 * W12 learn demo data: a completed enrollment with a real certificate,
 * a partial enrollment, and a demo quiz with a graded attempt for the
 * canonical customer account. Idempotent.
 *
 * Stored progress always matches the lesson rows behind it, so the first
 * real completion event recomputes the same numbers instead of dropping a
 * seeded percentage to zero.
 */
class LearnDemoSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@everythingneed.com')->first();
        if (!$customer) {
            return;
        }

        $react = \DB::table('courses')->where('slug', 'react-complete-guide')->first();
        $marketing = \DB::table('courses')->where('slug', 'digital-marketing')->first();

        if ($marketing) {
            Enrollment::firstOrCreate(
                ['user_id' => $customer->id, 'course_id' => $marketing->id],
                [
                    'progress' => 100,
                    'completed_at' => now()->subDays(2),
                    'last_active_at' => now()->subDays(2),
                ]
            );

            // Every lesson really is finished: the certificate above is real.
            $this->completeLessons($customer->id, $marketing->id);

            // Real issuance path (idempotent: returns the existing cert).
            app(IssueCertificate::class)->execute($customer->id, $marketing->id);
        }

        if ($react) {
            Enrollment::firstOrCreate(
                ['user_id' => $customer->id, 'course_id' => $react->id],
                [
                    // 2 of 3 lessons done, final quiz still pending: with the
                    // quiz counted as a completion unit that is 2/4 = 50%.
                    'progress' => 50,
                    'last_active_at' => now(),
                ]
            );

            $this->completeLessons($customer->id, $react->id, limit: 2);

            $quiz = Quiz::firstOrCreate(
                ['title' => 'DEMO: React fundamentals check'],
                [
                    'course_id' => $react->id,
                    'questions' => [
                        ['id' => 'q1', 'question' => 'JSX stands for?', 'options' => ['JavaScript XML', 'Java Syntax Extension'], 'correct_index' => 0],
                        ['id' => 'q2', 'question' => 'React state updates are…', 'options' => ['Synchronous always', 'Asynchronous and batched'], 'correct_index' => 1],
                    ],
                    'pass_score_percent' => 70,
                ]
            );

            $answers = ['q1' => 0, 'q2' => 0];
            $result = $quiz->grade($answers);

            $hasAttempt = QuizAttempt::where('quiz_id', $quiz->id)
                ->where('user_id', $customer->id)
                ->exists();

            if (!$hasAttempt) {
                QuizAttempt::create([
                    'quiz_id' => $quiz->id,
                    'user_id' => $customer->id,
                    'answers' => $answers,
                    'result' => ['score' => $result['score'], 'total' => $result['total']],
                    'passed' => $result['passed'],
                ]);
            }
        }
    }

    /**
     * Materialize lesson completion rows (optionally only the first N).
     */
    private function completeLessons(string $userId, string $courseId, ?int $limit = null): void
    {
        $query = CourseLesson::where('course_id', $courseId)->orderBy('lesson_order');
        if ($limit !== null) {
            $query->limit($limit);
        }

        foreach ($query->pluck('id') as $lessonId) {
            VideoProgress::updateOrCreate(
                ['user_id' => $userId, 'lesson_id' => $lessonId],
                [
                    'course_id' => $courseId,
                    'completed' => true,
                    'watch_time_seconds' => 0,
                    'progress_percent' => 100,
                ]
            );
        }
    }
}
