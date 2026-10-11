<?php

namespace Modules\Services\Entities;

use App\Models\Model;

class ServiceBooking extends Model
{
    protected $fillable = [
        'booking_number',
        'service_id',
        'user_id',
        'notes',
        'answers',
        'amount',
        'currency',
        'status',
        'payment_status',
        'payment_id',
        'paid_at',
    ];

    protected $casts = [
        'answers' => 'array',
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

    public function service()
    {
        return $this->belongsTo(ServiceDefinition::class, 'service_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
