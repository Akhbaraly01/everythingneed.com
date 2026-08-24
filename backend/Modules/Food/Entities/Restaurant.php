<?php

namespace Modules\Food\Entities;

use App\Models\Model;

class Restaurant extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'cuisine_type',
        'address',
        'city',
        'latitude',
        'longitude',
        'phone',
        'image_url',
        'rating',
        'is_active',
        'opening_hours',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'rating' => 'decimal:1',
        'is_active' => 'boolean',
        'opening_hours' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function menuItems()
    {
        return $this->hasMany(MenuItem::class);
    }

    public function orders()
    {
        return $this->hasMany(FoodOrder::class);
    }
}
