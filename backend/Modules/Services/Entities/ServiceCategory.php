<?php

namespace Modules\Services\Entities;

use App\Models\Model;

/**
 * Mega-phase M-1: service taxonomy node (root category or subcategory).
 *
 * Slugs are the public filter key (`/api/services?category=<slug>`); icons
 * are lucide-style keys the frontend maps to components. Rows with live
 * services or children are protected from deletion (deactivate instead),
 * matching the needs taxonomy contract.
 */
class ServiceCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'color',
        'sort_order',
        'parent_id',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'parent_id' => 'string',
        'is_active' => 'boolean',
    ];

    public function services()
    {
        return $this->hasMany(ServiceDefinition::class, 'category_id');
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }
}
