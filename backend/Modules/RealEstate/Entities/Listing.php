<?php

namespace Modules\RealEstate\Entities;

use App\Models\Model;

class Listing extends Model
{
    protected $fillable = [
        'property_id',
        'user_id',
        'listing_type',
        'price',
        'currency',
        'status',
        'available_from',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'available_from' => 'date',
    ];

    const TYPE_SALE = 'sale';
    const TYPE_RENT = 'rent';

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_SOLD = 'sold';
    const STATUS_RENTED = 'rented';

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
