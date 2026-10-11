<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class HealthServiceRequest extends Model
{
    protected $fillable = [
        'patient_id',
        'request_number',
        'category',
        'title',
        'details',
        'preferred_date',
        'location',
        'contact_phone',
        'status',
        'assigned_doctor_id',
        'admin_note',
        'decided_by',
        'decided_at',
        'idempotency_key',
    ];

    protected $casts = [
        'preferred_date' => 'date',
        'decided_at' => 'datetime',
    ];

    const STATUS_OPEN = 'open';
    const STATUS_CONTACTED = 'contacted';
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_CLOSED = 'closed';
    const STATUS_CANCELLED = 'cancelled';

    const TERMINAL = [self::STATUS_CLOSED, self::STATUS_CANCELLED];

    public function patient()
    {
        return $this->belongsTo(\App\Models\User::class, 'patient_id');
    }

    public function assignedDoctor()
    {
        return $this->belongsTo(Doctor::class, 'assigned_doctor_id');
    }

    public function decider()
    {
        return $this->belongsTo(\App\Models\User::class, 'decided_by');
    }
}
