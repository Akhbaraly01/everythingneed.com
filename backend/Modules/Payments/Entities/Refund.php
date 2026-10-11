<?php

namespace Modules\Payments\Entities;

use App\Models\Model;

/**
 * A refund is REQUESTED first (pending, no money moves) and only processed
 * after support reviews it. `method` snapshots the payment method so the
 * payout always goes back the way the customer paid.
 */
class Refund extends Model
{
    protected $fillable = [
        'payment_id',
        'requested_by',
        'reviewed_by',
        'amount',
        'method',
        'idempotency_key',
        'cancellation_id',
        'reason',
        'requested_at',
        'reviewed_at',
        'rejection_reason',
        'status',
        'gateway_response',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
        'requested_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_COMPLETED = 'completed';
    const STATUS_SUCCEEDED = 'succeeded';
    const STATUS_FAILED = 'failed';

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function requestedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'requested_by');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'reviewed_by');
    }

    /** Money has actually moved back to the customer. */
    public function isProcessed(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_SUCCEEDED], true);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }
}
