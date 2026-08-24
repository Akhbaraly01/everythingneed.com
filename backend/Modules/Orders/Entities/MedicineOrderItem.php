<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class MedicineOrderItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'medicine_id',
        'quantity',
        'unit_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(MedicineOrder::class, 'order_id');
    }

    public function medicine()
    {
        return $this->belongsTo(\Modules\Pharmacy\Entities\Medicine::class);
    }
}
