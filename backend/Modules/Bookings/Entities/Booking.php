<?php

namespace Modules\Bookings\Entities;

use App\Models\Model;

class Booking extends Model
{
    protected $fillable = [
        'user_id',
        'service_type',
        'service_id',
        'details',
        'status',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
