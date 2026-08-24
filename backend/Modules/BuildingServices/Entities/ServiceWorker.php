<?php

namespace Modules\BuildingServices\Entities;

use App\Models\Model;

class ServiceWorker extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'worker_type',
        'bio',
        'avatar_url',
        'hourly_rate',
        'experience_years',
        'completed_jobs',
        'is_available',
        'rating',
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'experience_years' => 'integer',
        'completed_jobs' => 'integer',
        'is_available' => 'boolean',
        'rating' => 'decimal:1',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function bookings()
    {
        return $this->hasMany(BuildingServiceBooking::class);
    }
}
