<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedBooking extends Model
{
    protected $table = 'need_bookings';

    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_NO_SHOW = 'no_show';

    public const STATUSES = [
        self::STATUS_SCHEDULED,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
        self::STATUS_NO_SHOW,
    ];

    /**
     * Free reschedule/cancel cutoff. Inside the window the slot is locked to
     * protect the provider's day (Taskrabbit-style 24h rule, constant so
     * operations can tune it per category later).
     */
    public const FREE_CHANGE_HOURS = 24;

    protected $fillable = [
        'need_request_id',
        'provider_id',
        'booked_by',
        'scheduled_start',
        'scheduled_end',
        'timezone',
        'status',
        'cancel_reason',
        'reschedule_count',
    ];

    protected $casts = [
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'reschedule_count' => 'integer',
    ];

    public function request()
    {
        return $this->belongsTo(NeedRequest::class, 'need_request_id');
    }

    public function provider()
    {
        return $this->belongsTo(\App\Models\User::class, 'provider_id');
    }

    public function isLockedByPolicy(): bool
    {
        return $this->scheduled_start !== null
            && $this->scheduled_start->copy()->subHours(self::FREE_CHANGE_HOURS)->isPast();
    }
}
