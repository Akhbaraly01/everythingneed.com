<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class Order extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SHIPPED = 'shipped';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REFUNDED = 'refunded';

    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'subtotal',
        'discount',
        'shipping_fee',
        'total_amount',
        'currency',
        'coupon_code',
        'shipping_address',
        'shipping_city',
        'shipping_country',
        'phone',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function payments()
    {
        return $this->hasMany(\Modules\Payments\Entities\Payment::class, 'order_id');
    }

    public function tracking()
    {
        return $this->hasMany(\Modules\Orders\Entities\OrderTracking::class, 'order_id')
            ->orderBy('created_at', 'asc');
    }
}
