<?php

namespace Modules\Needs\Entities;

use App\Models\Model;
use Core\Support\HasSlug;

class NeedItem extends Model
{
    use HasSlug;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
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
