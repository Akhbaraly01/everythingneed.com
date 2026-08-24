<?php

namespace Modules\Inventory\Entities;

use App\Models\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'product_id',
        'type',
        'quantity',
        'reference_type',
        'reference_id',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(\Modules\Products\Entities\Product::class);
    }
}
