<?php

namespace Modules\Checkout\Entities;

use App\Models\Model;

class CartItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity',
        'unit_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
    ];

    public function cart()
    {
        return $this->belongsTo(Cart::class, 'cart_id');
    }

    public function product()
    {
        return $this->belongsTo(\Modules\Products\Entities\Product::class);
    }
}
