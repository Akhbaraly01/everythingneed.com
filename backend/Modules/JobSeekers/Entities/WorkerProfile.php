<?php

namespace Modules\JobSeekers\Entities;

use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkerProfile extends Model
{
    public const AVAILABILITY = ['available', 'busy', 'unavailable'];

    protected $table = 'worker_profiles';

    protected $fillable = [
        'user_id',
        'headline',
        'bio',
        'category',
        'skills',
        'experience',
        'education',
        'portfolio',
        'hourly_rate',
        'daily_rate',
        'currency',
        'availability',
        'city',
        'country',
        'rating_avg',
        'rating_count',
        'completed_jobs',
        'is_verified',
    ];

    protected $casts = [
        'skills' => 'array',
        'experience' => 'array',
        'education' => 'array',
        'portfolio' => 'array',
        'hourly_rate' => 'decimal:2',
        'daily_rate' => 'decimal:2',
        'rating_avg' => 'decimal:2',
        'rating_count' => 'integer',
        'completed_jobs' => 'integer',
        'is_verified' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function workRequests(): HasMany
    {
        return $this->hasMany(WorkRequest::class, 'worker_profile_id');
    }

    public function offers(): HasMany
    {
        return $this->hasMany(WorkOffer::class, 'worker_profile_id');
    }

    public function recordRating(int $stars): void
    {
        $total = ($this->rating_avg * $this->rating_count) + $stars;

        $this->rating_count += 1;
        $this->rating_avg = round($total / $this->rating_count, 2);
        $this->save();
    }
}
