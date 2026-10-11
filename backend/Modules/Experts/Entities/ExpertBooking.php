<?php

namespace Modules\Experts\Entities;

use App\Models\Model;

class ExpertBooking extends Model
{
    protected $fillable = [
        'booking_number',
        'expert_id',
        'user_id',
        'scheduled_date',
        'scheduled_time',
        'duration_minutes',
        'mode',
        'notes',
        'amount',
        'currency',
        'status',
        'payment_status',
        'payment_id',
        'paid_at',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'duration_minutes' => 'integer',
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    const PAYMENT_UNPAID = 'unpaid';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_REFUNDED = 'refunded';

    public function expert()
    {
        return $this->belongsTo(\Modules\Healthcare\Entities\Doctor::class, 'expert_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
