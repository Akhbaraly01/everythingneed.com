<?php

namespace Modules\Learn\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Learn\Entities\Quiz;
use Modules\Learn\Entities\QuizAttempt;

class QuizController extends Controller
{
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

        return response()->json(['data' => $result]);
    }
}
