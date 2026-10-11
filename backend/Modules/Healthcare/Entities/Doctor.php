<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class Doctor extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'specialization',
        'profession',
        'qualification',
        'experience_years',
        'consultation_fee',
        'virtual_fee',
        'home_visit_fee',
        'avatar_url',
        'is_available',
        'rating',
    ];

    protected $casts = [
        'experience_years' => 'integer',
        'consultation_fee' => 'decimal:2',
        'virtual_fee' => 'decimal:2',
        'home_visit_fee' => 'decimal:2',
        'is_available' => 'boolean',
        'rating' => 'decimal:1',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function healthTickets()
    {
        return $this->hasMany(HealthTicket::class);
    }
}
