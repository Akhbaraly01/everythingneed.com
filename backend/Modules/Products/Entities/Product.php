<?php

namespace Modules\Products\Entities;

use App\Models\Model;
use Core\Support\HasSlug;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\Factory;

class Product extends Model
{
    use HasSlug;

    protected static function newFactory(): Factory
    {
        return ProductFactory::new();
    }
    protected $fillable = [
        'vendor_id',
        'brand_id',
        'name',
        'slug',
        'sku',
        'description',
        'category',
        'subcategory',
        'price',
        'compare_price',
        'currency',
        'tax_rate',
        'discount_percent',
        'featured',
        'publication_state',
        'specifications',
        'attributes',
        'shipping',
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
        'tax_rate' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'featured' => 'boolean',
        'specifications' => 'array',
        'attributes' => 'array',
        'shipping' => 'array',
        'images' => 'array',
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
        'approved_at' => 'datetime',
        'rating' => 'decimal:1',
        'reviews_count' => 'integer',
    ];

    /** Spec 37 publication states (draft / published / hidden / archived). */
    const PUBLICATION_STATES = ['draft', 'published', 'hidden', 'archived'];

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

    /**
     * Whitelisted server-side listing sorts (spec §87).
     */
    public function scopeApplySort($query, ?string $sort)
    {
        $map = [
            'price_asc' => ['price', 'asc'],
            'price_desc' => ['price', 'desc'],
            'name_asc' => ['name', 'asc'],
            'name_desc' => ['name', 'desc'],
        ];

        if (isset($map[$sort])) {
            return $query->orderBy($map[$sort][0], $map[$sort][1]);
        }

        if ($sort === 'rating') {
            return $query->orderByRaw('coalesce(rating, -1) desc')->orderBy('created_at', 'desc');
        }

        if ($sort === 'popular') {
            return $query->orderBy('reviews_count', 'desc')->orderBy('created_at', 'desc');
        }

        return $query->orderBy('created_at', 'desc');
    }
}
