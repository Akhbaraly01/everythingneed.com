<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class HomePageSection extends Uuid7Model
{
    protected $table = 'home_page_sections';

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Admin-ordered, active-only listing for the Home builder.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('name');
    }

    /**
     * Active sections in admin order (storefront rendering).
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
