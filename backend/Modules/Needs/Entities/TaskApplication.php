<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class TaskApplication extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_PAID = 'paid';

    protected $fillable = [
        'task_post_id',
        'user_id',
        'message',
        'evidence_url',
        'evidence_note',
        'payout',
        'status',
    ];

    protected $casts = [
        'payout' => 'decimal:2',
    ];

    public function task()
    {
        return $this->belongsTo(TaskPost::class, 'task_post_id');
    }

    public function worker()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
