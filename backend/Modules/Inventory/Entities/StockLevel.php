<?php

namespace Modules\Inventory\Entities;

use App\Models\Model;

class StockLevel extends Model
{
    /** stock_levels has no created_at/updated_at columns. */
    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'quantity',
        'reserved_quantity',
        'reorder_point',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'reserved_quantity' => 'integer',
        'reorder_point' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(\Modules\Products\Entities\Product::class);
    }
}
