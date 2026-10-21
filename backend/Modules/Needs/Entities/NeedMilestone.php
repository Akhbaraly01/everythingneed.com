<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

/**
 * N-20 milestone escrow ledger row.
 *
 * The row is the ledger entry for one milestone of a request. `payment_id`
 * is the escrow funding payment (the platform holds the money), and
 * `payout_payment_id` is the release payment that credits the provider.
 */
class NeedMilestone extends Model
{
    protected $table = 'need_milestones';

    public const STATUS_PENDING = 'pending';
    public const STATUS_FUNDED = 'funded';
    public const STATUS_RELEASED = 'released';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_DISPUTED = 'disputed';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_FUNDED,
        self::STATUS_RELEASED,
        self::STATUS_REFUNDED,
        self::STATUS_DISPUTED,
    ];

    protected $fillable = [
        'need_request_id',
        'offer_id',
        'title',
        'description',
        'amount',
        'currency',
        'sequence',
        'status',
        'payment_id',
        'payout_payment_id',
        'created_by',
        'funded_at',
        'released_at',
        'refunded_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'sequence' => 'integer',
        'funded_at' => 'datetime',
        'released_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    public function request()
    {
        return $this->belongsTo(NeedRequest::class, 'need_request_id');
    }

    public function offer()
    {
        return $this->belongsTo(NeedOffer::class, 'offer_id');
    }

    /** The escrow funding payment (platform-held). */
    public function payment()
    {
        return $this->belongsTo(\Modules\Payments\Entities\Payment::class, 'payment_id');
    }

    /** The release payment that credited the provider. */
    public function payout()
    {
        return $this->belongsTo(\Modules\Payments\Entities\Payment::class, 'payout_payment_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function isSettled(): bool
    {
        return in_array($this->status, [self::STATUS_RELEASED, self::STATUS_REFUNDED], true);
    }
}
