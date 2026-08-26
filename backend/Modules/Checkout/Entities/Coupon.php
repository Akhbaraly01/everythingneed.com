<?php

namespace Modules\Checkout\Entities;

use App\Models\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'min_order_amount',
        'max_uses',
        'used_count',
        'per_user_limit',
        'applicable_categories',
        'applicable_product_id',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_uses' => 'integer',
        'used_count' => 'integer',
        'per_user_limit' => 'integer',
        'applicable_categories' => 'array',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];
}
