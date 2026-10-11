<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class NavigationItem extends Uuid7Model
{
    protected $table = 'navigation_items';

    protected $casts = [
        'permissions' => 'array',
        'device_visibility' => 'array',
        'is_active' => 'boolean',
        'open_in_new_tab' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function navigation()
    {
        return $this->belongsTo(Navigation::class, 'navigation_id');
    }

    public function parent()
    {
        return $this->belongsTo(NavigationItem::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(NavigationItem::class, 'parent_id');
    }
}
