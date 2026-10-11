<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class CmsPage extends Uuid7Model
{
    protected $table = 'cms_pages';

    protected $casts = [
        'status' => 'string',
        // Spec 45/88: published_at reaches JSON-LD/SEO builders as Carbon
        // (raw DB value is a string, which breaks ->toIso8601String()).
        'published_at' => 'datetime',
    ];

    public function blocks()
    {
        return $this->hasMany(CmsBlock::class, 'page_id')->orderBy('sort_order');
    }

    public function revisions()
    {
        return $this->hasMany(CmsRevision::class, 'page_id')->orderByDesc('version');
    }
}
