<?php

namespace Modules\Admin\Entities;

use App\Models\User;
use App\Models\Uuid7Model;

class CmsRevision extends Uuid7Model
{
    protected $table = 'cms_revisions';

    // Snapshots are immutable history: the table has created_at only.
    const UPDATED_AT = null;

    protected $casts = [
        'snapshot' => 'array',
        'version' => 'integer',
    ];

    public function page()
    {
        return $this->belongsTo(CmsPage::class, 'page_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
