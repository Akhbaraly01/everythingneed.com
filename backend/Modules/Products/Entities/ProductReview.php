<?php

namespace Modules\Products\Entities;

use App\Models\Model;

class ProductReview extends Model
{
    protected $fillable = [
        'product_id',
        'user_id',
        'rating',
        'title',
        'comment',
        'is_verified_purchase',
        'helpful_count',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_verified_purchase' => 'boolean',
        'helpful_count' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
