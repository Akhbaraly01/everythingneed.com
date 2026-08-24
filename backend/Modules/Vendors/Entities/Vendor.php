<?php

namespace Modules\Vendors\Entities;

use App\Models\Model;
use Database\Factories\VendorFactory;
use Illuminate\Database\Eloquent\Factories\Factory;

class Vendor extends Model
{
    protected static function newFactory(): Factory
    {
        return VendorFactory::new();
    }
    protected $fillable = [
        'user_id',
        'store_name',
        'category',
        'description',
        'is_verified',
        'rating',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'rating' => 'decimal:1',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function products()
    {
        return $this->hasMany(\Modules\Products\Entities\Product::class);
    }

    public function orders()
    {
        return $this->hasMany(\Modules\Orders\Entities\VendorOrder::class);
    }
}
