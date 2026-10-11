<?php

namespace Modules\Learn\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Modules\Learn\Actions\ComputeCourseProgress;
use Modules\Learn\Entities\Enrollment;
use Modules\Learn\Entities\Quiz;
use Modules\Learn\Entities\QuizAttempt;

class QuizController extends Controller
{
    public function __construct(private ComputeCourseProgress $computeProgress) {}
    public function show(Request $request, string $id): JsonResponse
    {
        $quiz = Quiz::find($id);

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found'], 404);
        }

        $lastAttempt = QuizAttempt::where('quiz_id', $id)
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'data' => $quiz->toPublicArray() + [
                'last_attempt' => $lastAttempt ? [
                    'score' => $lastAttempt->result['score'] ?? null,
                    'total' => $lastAttempt->result['total'] ?? null,
                    'passed' => $lastAttempt->passed,
                ] : null,
            ],
        ]);
    }

    public function submit(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'answers' => ['required', 'array', 'max:200'],
        ]);

        $quiz = Quiz::find($id);

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found'], 404);
        }

        // Normalize answers to string keys/values (SPA sends Record<string,string>)
        $answers = collect($validated['answers'])
            ->mapWithKeys(fn ($v, $k) => [(string) $k => is_scalar($v) ? (string) $v : '']);

        $result = $quiz->grade($answers->all());

        QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $request->user()->id,
            'answers' => $answers->all(),
            'result' => ['score' => $result['score'], 'total' => $result['total']],
            'passed' => $result['passed'],
        ]);

        // Spec 19 "completion": a passed attempt moves the course forward the
        // same way a finished lesson does (learners without an enrollment just
        // get their attempt recorded - no progress to move).
        $courseProgress = null;
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $quiz->course_id)
            ->first();

        if ($enrollment) {
            $detail = ($this->computeProgress)->execute($request->user()->id, $quiz->course_id);

            $enrollment->update([
                'progress' => $detail['progress'],
                'completed_at' => $detail['progress'] === 100 ? Carbon::now() : null,
                'last_active_at' => Carbon::now(),
            ]);

            $courseProgress = [
                'progress' => $detail['progress'],
                'course_completed' => $detail['progress'] === 100,
                'lessons_completed' => $detail['lessons_completed'],
                'lessons_total' => $detail['lessons_total'],
                'quizzes_passed' => $detail['quizzes_passed'],
                'quizzes_total' => $detail['quizzes_total'],
            ];
        }

        return response()->json([
            'data' => $result + ['course_progress' => $courseProgress],
        ]);
    }

    /**
     * The current user's quiz attempt history (deep-link endpoint).
     */
    public function myResults(Request $request): JsonResponse
    {
        $attempts = \Modules\Learn\Entities\QuizAttempt::where('user_id', $request->user()->id)
            ->with('quiz.course:id,title')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'course_title' => $a->quiz->course->title ?? 'Course',
                'score' => $a->result['score'] ?? 0,
                'total_questions' => $a->result['total'] ?? $a->quiz->questions_count ?? 0,
                'passed' => $a->passed,
                'completed_at' => $a->created_at,
            ]);

        return response()->json(['data' => $attempts]);
    }
}
