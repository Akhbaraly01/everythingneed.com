<?php

namespace Modules\JobSeekers\Entities;

use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkRequest extends Model
{
    public const STATUSES = [
        'open', 'negotiating', 'accepted', 'paid', 'in_progress',
        'completed', 'cancelled', 'disputed',
    ];

    protected $table = 'work_requests';

    protected $fillable = [
        'requester_id',
        'worker_profile_id',
        'title',
        'description',
        'category',
        'location',
        'start_date',
        'estimated_duration',
        'budget_min',
        'budget_max',
        'currency',
        'workers_needed',
        'status',
        'agreed_rate',
    ];

    protected $casts = [
        'start_date' => 'date',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'agreed_rate' => 'decimal:2',
        'workers_needed' => 'integer',
        'rated_at' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'requester_id');
    }

    public function workerProfile(): BelongsTo
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_profile_id');
    }

    public function offers(): HasMany
    {
        return $this->hasMany(WorkOffer::class);
    }
}
