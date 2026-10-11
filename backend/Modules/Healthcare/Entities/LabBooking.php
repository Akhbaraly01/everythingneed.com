<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class LabBooking extends Model
{
    protected $fillable = [
        'patient_id',
        'lab_test_id',
        'booking_number',
        'appointment_date',
        'appointment_time',
        'price',
        'status',
        'is_paid',
        'payment_reference',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'price' => 'decimal:2',
        'is_paid' => 'boolean',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    public function patient()
    {
        return $this->belongsTo(\App\Models\User::class, 'patient_id');
    }

    public function labTest()
    {
        return $this->belongsTo(LabTest::class, 'lab_test_id');
    }
}
