<?php

namespace Modules\Engagement\Entities;

use App\Models\Model;

class Wishlist extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'product_id',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function product()
    {
        return $this->belongsTo(\Modules\Products\Entities\Product::class);
    }
}
