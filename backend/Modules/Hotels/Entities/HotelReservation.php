<?php

namespace Modules\Hotels\Entities;

use App\Models\Model;

class HotelReservation extends Model
{
    protected $fillable = [
        'reference',
        'user_id',
        'hotel_id',
        'room_id',
        'check_in_date',
        'check_out_date',
        'guests',
        'total_amount',
        'currency',
        'status',
        'special_requests',
        'checked_in_at',
        'checked_out_at',
        'payment_status',
        'payment_id',
        'paid_at',
    ];

    protected $casts = [
        'check_in_date' => 'date',
        'check_out_date' => 'date',
        'guests' => 'integer',
        'total_amount' => 'decimal:2',
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_CHECKED_IN = 'checked_in';
    const STATUS_CHECKED_OUT = 'checked_out';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_COMPLETED = 'completed';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function room()
    {
        return $this->belongsTo(HotelRoom::class, 'room_id');
    }
}
