<?php

namespace Modules\Checkout\Entities;

use App\Models\Model;

class ShippingRate extends Model
{
    protected $fillable = [
        'name',
        'rate',
        'free_shipping_min_subtotal',
        'is_active',
        'sort',
    ];

    protected $casts = [
        'rate' => 'float',
        'free_shipping_min_subtotal' => 'float',
        'is_active' => 'boolean',
        'sort' => 'integer',
    ];
}
