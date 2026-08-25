<?php

namespace Modules\Learn\Entities;

use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $table = 'quizzes';

    protected $fillable = [
        'course_id',
        'title',
        'questions',
        'pass_score_percent',
    ];

    protected $casts = [
        'questions' => 'array',
        'pass_score_percent' => 'integer',
    ];

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * Public shape — never leaks correct answers.
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'title' => $this->title,
            'pass_score_percent' => $this->pass_score_percent,
            'total' => count($this->questions ?? []),
            'questions' => collect($this->questions ?? [])->map(fn ($q) => [
                'id' => (string) ($q['id'] ?? ''),
                'question' => $q['question'] ?? '',
                'options' => array_values($q['options'] ?? []),
            ])->all(),
        ];
    }

    /**
     * Server-side grading. Returns score payload; never trusts client results.
     */
    public function grade(array $answers): array
    {
        $questions = $this->questions ?? [];
        $score = 0;
        $correctMap = [];

        foreach ($questions as $q) {
            $qid = (string) ($q['id'] ?? '');
            $correctIndex = $q['correct_index'] ?? null;
            $chosen = $answers[$qid] ?? null;

            $isCorrect = $chosen !== null && (int) $chosen === (int) $correctIndex;
            if ($isCorrect) {
                $score++;
            }
            $correctMap[$qid] = (string) $correctIndex;
        }

        $total = max(count($questions), 1);

        return [
            'score' => $score,
            'total' => count($questions),
            'passed' => ($score / $total) * 100 >= $this->pass_score_percent,
            'correct_answers' => $correctMap,
        ];
    }
}
