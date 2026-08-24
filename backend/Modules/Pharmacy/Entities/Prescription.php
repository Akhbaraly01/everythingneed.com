<?php

namespace Modules\Pharmacy\Entities;

use App\Models\Model;

class Prescription extends Model
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_FILLED = 'filled';
    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'code',
        'patient_id',
        'doctor_id',
        'consultation_id',
        'items',
        'status',
        'notes',
    ];

    protected $casts = [
        'items' => 'array',
    ];

    public function patient()
    {
        return $this->belongsTo(\App\Models\User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(\Modules\Healthcare\Entities\Doctor::class);
    }
}
