<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class Navigation extends Uuid7Model
{
    protected $table = 'navigations';

    protected $casts = [
        'status' => 'string',
    ];

    public function items()
    {
        return $this->hasMany(NavigationItem::class, 'navigation_id');
    }
}
