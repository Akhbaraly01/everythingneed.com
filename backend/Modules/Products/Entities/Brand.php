<?php

namespace Modules\Products\Entities;

use App\Models\Model;

class Brand extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'logo_url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
