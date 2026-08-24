<?php

namespace Modules\Checkout\Entities;

use App\Models\Model;

class Cart extends Model
{
    protected $fillable = [
        'user_id',
        'coupon_code',
        'discount_amount',
        'notes',
    ];

    protected $casts = [
        'discount_amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class, 'cart_id');
    }
}
