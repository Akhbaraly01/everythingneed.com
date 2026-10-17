<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

/**
 * N-29 cost guide: admin-managed per-category pricing content
 * (price ranges, cost factors, FAQs) powering public discovery
 * pages and the N-35/N-38 estimate endpoints.
 */
class NeedCostGuide extends Model
{
    public $timestamps = true;

    protected $fillable = [
        'need_category_id',
        'slug',
        'title',
        'summary',
        'price_min',
        'price_max',
        'price_avg',
        'currency',
        'pricing_unit',
        'factors',
        'faqs',
        'source_note',
        'status',
    ];

    protected $casts = [
        'price_min' => 'decimal:2',
        'price_max' => 'decimal:2',
        'price_avg' => 'decimal:2',
        'factors' => 'array',
        'faqs' => 'array',
    ];

    public function category()
    {
        return $this->belongsTo(NeedCategory::class, 'need_category_id');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
