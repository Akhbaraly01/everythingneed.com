<?php

namespace Modules\Hotels\Entities;

use App\Models\Model;

class HotelRoom extends Model
{
    protected $fillable = [
        'hotel_id',
        'room_type',
        'price_per_night',
        'currency',
        'capacity',
        'amenities',
        'is_available',
        'image_url',
    ];

    protected $casts = [
        'price_per_night' => 'decimal:2',
        'capacity' => 'integer',
        'amenities' => 'array',
        'is_available' => 'boolean',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function reservations()
    {
        return $this->hasMany(HotelReservation::class);
    }
}
