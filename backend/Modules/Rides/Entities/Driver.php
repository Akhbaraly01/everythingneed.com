<?php

namespace Modules\Rides\Entities;

use App\Models\Model;

class Driver extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'license_number',
        'vehicle_type',
        'is_available',
        'rating',
        'total_rides',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'rating' => 'decimal:1',
        'total_rides' => 'integer',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function vehicle()
    {
        return $this->hasOne(Vehicle::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class);
    }
}
