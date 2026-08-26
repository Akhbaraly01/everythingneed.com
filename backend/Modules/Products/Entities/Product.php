<?php

namespace Modules\Products\Entities;

use App\Models\Model;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\Factory;

class Product extends Model
{
    protected static function newFactory(): Factory
    {
        return ProductFactory::new();
    }
    protected $fillable = [
        'vendor_id',
        'brand_id',
        'name',
        'description',
        'category',
        'subcategory',
        'price',
        'compare_price',
        'image_url',
        'images',
        'video_url',
        'production_video_url',
        'stock_quantity',
        'is_active',
        'approved_at',
        'rating',
        'reviews_count',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_price' => 'decimal:2',
        'images' => 'array',
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
        'approved_at' => 'datetime',
        'rating' => 'decimal:1',
        'reviews_count' => 'integer',
    ];

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function vendor()
    {
        return $this->belongsTo(\Modules\Vendors\Entities\Vendor::class);
    }

    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
    }
}
