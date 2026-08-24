<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class OrderTracking extends Model
{
    protected $table = 'order_tracking';

    protected $fillable = [
        'order_id',
        'order_type',
        'user_id',
        'vendor_id',
        'status',
        'status_message',
        'estimated_delivery',
        'location_lat',
        'location_lng',
    ];

    protected $casts = [
        'estimated_delivery' => 'datetime',
        'location_lat' => 'decimal:7',
        'location_lng' => 'decimal:7',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
