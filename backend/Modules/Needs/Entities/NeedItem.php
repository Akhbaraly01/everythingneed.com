<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedItem extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'description',
        'price',
        'image_url',
        'is_available',
        'vendor_id',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(NeedCategory::class, 'category_id');
    }

    public function vendor()
    {
        return $this->belongsTo(\Modules\Vendors\Entities\Vendor::class);
    }
}
