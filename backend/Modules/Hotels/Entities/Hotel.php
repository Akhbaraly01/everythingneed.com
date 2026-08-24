<?php

namespace Modules\Hotels\Entities;

use App\Models\Model;

class Hotel extends Model
{
    protected $fillable = [
        'name',
        'description',
        'address',
        'city',
        'state',
        'country',
        'latitude',
        'longitude',
        'phone',
        'email',
        'star_rating',
        'image_url',
        'amenities',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'star_rating' => 'integer',
        'amenities' => 'array',
        'is_active' => 'boolean',
    ];

    public function rooms()
    {
        return $this->hasMany(HotelRoom::class);
    }

    public function reservations()
    {
        return $this->hasMany(HotelReservation::class);
    }
}
