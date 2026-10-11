<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class CmsBlock extends Uuid7Model
{
    protected $table = 'cms_blocks';

    protected $casts = [
        'data' => 'array',
        'is_visible' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function page()
    {
        return $this->belongsTo(CmsPage::class, 'page_id');
    }
}
