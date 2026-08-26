<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'vendor_id',
        'product_name',
        'variant_name',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(\Modules\Products\Entities\Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(\Modules\Products\Entities\ProductVariant::class);
    }

    public function vendor()
    {
        return $this->belongsTo(\Modules\Vendors\Entities\Vendor::class);
    }
}
