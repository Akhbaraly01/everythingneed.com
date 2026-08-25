<?php

namespace Modules\Learn\Entities;

use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttempt extends Model
{
    protected $table = 'quiz_attempts';

    protected $fillable = [
        'quiz_id',
        'user_id',
        'answers',
        'result',
        'passed',
    ];

    protected $casts = [
        'answers' => 'array',
        'result' => 'array',
        'passed' => 'boolean',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }
}
