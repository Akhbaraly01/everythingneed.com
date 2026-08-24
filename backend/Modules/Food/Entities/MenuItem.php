<?php

namespace Modules\Food\Entities;

use App\Models\Model;

class MenuItem extends Model
{
    protected $fillable = [
        'restaurant_id',
        'name',
        'description',
        'price',
        'category',
        'image_url',
        'is_available',
        'is_vegetarian',
        'is_vegan',
        'spice_level',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
        'is_vegetarian' => 'boolean',
        'is_vegan' => 'boolean',
        'spice_level' => 'integer',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
}
