<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class CmsForm extends Uuid7Model
{
    protected $table = 'cms_forms';

    protected $casts = [
        'fields' => 'array',
    ];

    public function submissions()
    {
        return $this->hasMany(CmsFormSubmission::class, 'form_id');
    }
}
