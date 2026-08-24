<?php

namespace Modules\Food\Entities;

use App\Models\Model;

class FoodOrder extends Model
{
    protected $fillable = [
        'user_id',
        'restaurant_id',
        'order_number',
        'delivery_address',
        'total_amount',
        'status',
        'delivery_fee',
        'estimated_delivery_time',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'estimated_delivery_time' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PREPARING = 'preparing';
    const STATUS_OUT_FOR_DELIVERY = 'out_for_delivery';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function items()
    {
        return $this->hasMany(FoodOrderItem::class, 'order_id');
    }
}
