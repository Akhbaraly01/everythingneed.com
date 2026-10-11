<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class HealthTicket extends Model
{
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'ticket_number',
        'symptoms',
        'description',
        'consultation_type',
        'consultation_fee',
        'appointment_date',
        'appointment_time',
        'home_address',
        'is_random_assignment',
        'status',
        'payment_status',
        'payment_id',
        'paid_at',
    ];

    protected $casts = [
        'consultation_fee' => 'decimal:2',
        'appointment_date' => 'date',
        'is_random_assignment' => 'boolean',
        'paid_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_ASSIGNED = 'assigned';
    const STATUS_IN_CONSULTATION = 'in_consultation';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    const PAYMENT_UNPAID = 'unpaid';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_REFUNDED = 'refunded';

    public function patient()
    {
        return $this->belongsTo(\App\Models\User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
