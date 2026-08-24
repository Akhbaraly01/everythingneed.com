<?php

namespace Modules\Pharmacy\Entities;

use App\Models\Model;

class Medicine extends Model
{
    protected $fillable = [
        'name',
        'generic_name',
        'category',
        'description',
        'price',
        'image_url',
        'requires_prescription',
        'stock_quantity',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'requires_prescription' => 'boolean',
        'stock_quantity' => 'integer',
    ];

    public function orderItems()
    {
        return $this->hasMany(\Modules\Orders\Entities\MedicineOrderItem::class, 'medicine_id');
    }
}
