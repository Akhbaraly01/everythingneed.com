<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class AidRequest extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'category',
        'goal_amount',
        'raised_amount',
        'currency',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'idempotency_key',
    ];

    protected $casts = [
        'goal_amount' => 'decimal:2',
        'raised_amount' => 'decimal:2',
        'reviewed_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_FUNDED = 'funded';
    const STATUS_CLOSED = 'closed';

    public function requester()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(\App\Models\User::class, 'reviewed_by');
    }

    public function donations()
    {
        return $this->hasMany(AidDonation::class, 'aid_request_id');
    }

    public function scopePubliclyVisible($query)
    {
        return $query->whereIn('status', [self::STATUS_APPROVED, self::STATUS_FUNDED]);
    }
}
