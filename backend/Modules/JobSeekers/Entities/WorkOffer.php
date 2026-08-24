<?php

namespace Modules\JobSeekers\Entities;

use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOffer extends Model
{
    protected $table = 'work_offers';

    protected $fillable = [
        'work_request_id',
        'worker_profile_id',
        'proposed_by',
        'rate',
        'message',
        'status',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
    ];

    public function workRequest(): BelongsTo
    {
        return $this->belongsTo(WorkRequest::class);
    }

    public function workerProfile(): BelongsTo
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_profile_id');
    }
}
