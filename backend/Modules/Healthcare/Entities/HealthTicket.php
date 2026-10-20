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
        'images',
    ];

    protected $casts = [
        'consultation_fee' => 'decimal:2',
        'appointment_date' => 'date',
        'is_random_assignment' => 'boolean',
        'paid_at' => 'datetime',
        'images' => 'array',
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

    /**
     * The payment that settled this consultation (L-H-3 receipt source).
     */
    public function payment()
    {
        return $this->belongsTo(\Modules\Payments\Entities\Payment::class, 'payment_id');
    }

    /**
     * Discussion messages on this appointment (L-H-3).
     */
    public function messages()
    {
        return $this->hasMany(AppointmentMessage::class, 'ticket_id');
    }
}
