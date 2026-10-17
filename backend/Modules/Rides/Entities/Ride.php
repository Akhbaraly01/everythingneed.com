<?php

namespace Modules\Rides\Entities;

use App\Models\Model;

class Ride extends Model
{
    protected $fillable = [
        'user_id',
        'driver_id',
        'pickup_address',
        'pickup_lat',
        'pickup_lng',
        'dropoff_address',
        'dropoff_lat',
        'dropoff_lng',
        'status',
        'fare',
        'currency',
        'distance_km',
        'duration_minutes',
        'scheduled_for',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'pickup_lat' => 'decimal:7',
        'pickup_lng' => 'decimal:7',
        'dropoff_lat' => 'decimal:7',
        'dropoff_lng' => 'decimal:7',
        'fare' => 'decimal:2',
        'distance_km' => 'decimal:2',
        'duration_minutes' => 'integer',
        'scheduled_for' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    const STATUS_REQUESTED = 'requested';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }
}
