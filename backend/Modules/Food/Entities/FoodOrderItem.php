<?php

namespace Modules\Food\Entities;

use App\Models\Model;

class FoodOrderItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'menu_item_id',
        'quantity',
        'unit_price',
        'special_instructions',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(FoodOrder::class, 'order_id');
    }

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }
}
