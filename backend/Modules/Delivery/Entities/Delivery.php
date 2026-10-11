<?php

namespace Modules\Delivery\Entities;

use App\Models\Model;

/**
 * Plan G2: one row per order tracking rider fulfillment.
 *
 * Lifecycle: assigned -> picked_up -> in_transit -> delivered | failed.
 * Transitions are enforced by the controller; this entity owns mass
 * assignment boundaries only.
 */
class Delivery extends Model
{
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_PICKED_UP = 'picked_up';
    public const STATUS_IN_TRANSIT = 'in_transit';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_FAILED = 'failed';

    public const ACTIVE = [
        self::STATUS_ASSIGNED,
        self::STATUS_PICKED_UP,
        self::STATUS_IN_TRANSIT,
    ];

    protected $fillable = [
        'order_id',
        'manager_id',
        'status',
        'pickup_address',
        'delivery_address',
        'notes',
        'assigned_at',
        'picked_up_at',
        'delivered_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'picked_up_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(\Modules\Orders\Entities\Order::class, 'order_id');
    }

    public function manager()
    {
        return $this->belongsTo(DeliveryManager::class, 'manager_id');
    }
}
