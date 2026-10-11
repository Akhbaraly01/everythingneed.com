<?php

namespace Modules\Learn\Entities;

use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

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
     * Server-side grading. Returns score payload; never trusts client results
     * and never reveals the answer key (spec 18) - not even after grading.
     *
     * Answers are option positions ("0", "1", ...). Anything else - free text,
     * out-of-range indexes - scores zero: casting arbitrary strings to int
     * would otherwise hand out a free correct answer whenever the key is 0.
     */
    public function grade(array $answers): array
    {
        $questions = $this->questions ?? [];
        $score = 0;

        foreach ($questions as $q) {
            $qid = (string) ($q['id'] ?? '');
            $chosen = $answers[$qid] ?? null;

            if ($chosen === null || !preg_match('/^\d+$/', (string) $chosen)) {
                continue;
            }

            $chosenIndex = (int) $chosen;
            $optionCount = count($q['options'] ?? []);
            $correctIndex = isset($q['correct_index']) ? (int) $q['correct_index'] : -1;

            if ($correctIndex >= 0 && $correctIndex < $optionCount && $chosenIndex === $correctIndex) {
                $score++;
            }
        }

        $total = max(count($questions), 1);

        return [
            'score' => $score,
            'total' => count($questions),
            'percent' => count($questions) > 0 ? (int) round(($score / $total) * 100) : 0,
            'passed' => ($score / $total) * 100 >= $this->pass_score_percent,
        ];
    }
}
