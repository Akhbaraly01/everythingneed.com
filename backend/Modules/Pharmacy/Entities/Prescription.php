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
        'expires_at',
    ];

    protected $casts = [
        'items' => 'array',
        'expires_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(\App\Models\User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(\Modules\Healthcare\Entities\Doctor::class);
    }

    public function orders()
    {
        return $this->hasMany(\Modules\Orders\Entities\MedicineOrder::class, 'prescription_id');
    }

    /**
     * Issuing consultation (prescriptions.consultation_id). Required by the
     * patient prescriptions page's eager load — eager loading only resolves
     * relations when the result set is non-empty, so a missing relation
     * silently passed empty-data tests and blew up for seeded accounts.
     */
    public function consultation()
    {
        return $this->belongsTo(\Modules\Healthcare\Entities\Consultation::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
