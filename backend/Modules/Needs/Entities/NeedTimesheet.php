<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

/**
 * N-25 hourly timesheet ledger row.
 *
 * One entry per provider per day: the provider logs the minutes worked,
 * the owner approves them, and the payout is computed from the approved
 * hours at the agreed rate.
 */
class NeedTimesheet extends Model
{
    protected $table = 'need_timesheets';

    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_PAID = 'paid';

    public const STATUSES = [
        self::STATUS_SUBMITTED,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
        self::STATUS_PAID,
    ];

    protected $fillable = [
        'need_request_id',
        'provider_id',
        'work_date',
        'minutes',
        'hourly_rate',
        'amount',
        'currency',
        'note',
        'status',
        'approved_by',
        'approved_at',
        'payment_id',
    ];

    protected $casts = [
        'work_date' => 'date',
        'minutes' => 'integer',
        'hourly_rate' => 'decimal:2',
        'amount' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function request()
    {
        return $this->belongsTo(NeedRequest::class, 'need_request_id');
    }

    public function provider()
    {
        return $this->belongsTo(\App\Models\User::class, 'provider_id');
    }

    public function approver()
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    public function payment()
    {
        return $this->belongsTo(\Modules\Payments\Entities\Payment::class, 'payment_id');
    }
}
