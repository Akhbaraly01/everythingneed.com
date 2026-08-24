<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class VendorOrder extends Model
{
    protected $fillable = [
        'order_id',
        'vendor_id',
        'customer_id',
        'product_id',
        'product_name',
        'quantity',
        'unit_price',
        'total_price',
        'order_number',
        'shipping_address',
        'notes',
        'status',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';

    public function vendor()
    {
        return $this->belongsTo(\Modules\Vendors\Entities\Vendor::class);
    }

    public function customer()
    {
        return $this->belongsTo(\App\Models\User::class, 'customer_id');
    }

    public function product()
    {
        return $this->belongsTo(\Modules\Products\Entities\Product::class);
    }
}
