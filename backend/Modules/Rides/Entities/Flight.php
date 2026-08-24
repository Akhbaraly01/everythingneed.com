<?php

namespace Modules\Rides\Entities;

use App\Models\Model;

class Flight extends Model
{
    protected $fillable = [
        'flight_number',
        'airline',
        'origin_city',
        'origin_code',
        'destination_city',
        'destination_code',
        'departure_time',
        'arrival_time',
        'duration_minutes',
        'price',
        'seats_total',
        'seats_available',
        'days_of_week',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'seats_total' => 'integer',
        'seats_available' => 'integer',
        'duration_minutes' => 'integer',
        'days_of_week' => 'array',
        'departure_time' => 'datetime:H:i',
        'arrival_time' => 'datetime:H:i',
        'is_active' => 'boolean',
    ];
}
