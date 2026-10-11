<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class Order extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SHIPPED = 'shipped';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_RETURNED = 'returned';
    public const STATUS_REFUND_REQUESTED = 'refund_requested';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_DISPUTED = 'disputed';

    /** Spec §32 full workflow set (customer + admin/vendor managed states). */
    public const STATUSES = [
        self::STATUS_PENDING, self::STATUS_PAID, self::STATUS_CONFIRMED,
        self::STATUS_PROCESSING, self::STATUS_SHIPPED, self::STATUS_DELIVERED,
        self::STATUS_COMPLETED, self::STATUS_CANCELLED, self::STATUS_RETURNED,
        self::STATUS_REFUND_REQUESTED, self::STATUS_REFUNDED, self::STATUS_DISPUTED,
    ];

    /** Statuses the customer may still act on (return/dispute/complete). */
    public const ACTIVE = [
        self::STATUS_PENDING, self::STATUS_PAID, self::STATUS_CONFIRMED,
        self::STATUS_PROCESSING, self::STATUS_SHIPPED, self::STATUS_DELIVERED,
        self::STATUS_COMPLETED,
    ];

    protected $fillable = [
        'user_id',
        'order_number',
        'idempotency_key',
        'status',
        'subtotal',
        'discount',
        'shipping_fee',
        'tax',
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
        'tax' => 'decimal:2',
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
