<?php

namespace Modules\RealEstate\Entities;

use App\Models\Model;

class Property extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'listing_type',
        'property_type',
        'price',
        'currency',
        'bedrooms',
        'bathrooms',
        'area_sqft',
        'address',
        'city',
        'state',
        'zip_code',
        'country',
        'latitude',
        'longitude',
        'images',
        'is_active',
        'is_featured',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'area_sqft' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'images' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function listings()
    {
        return $this->hasMany(Listing::class);
    }
}
