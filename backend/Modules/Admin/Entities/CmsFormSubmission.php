<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class CmsFormSubmission extends Uuid7Model
{
    protected $table = 'cms_form_submissions';

    protected $casts = [
        'data' => 'array',
    ];

    public function form()
    {
        return $this->belongsTo(CmsForm::class, 'form_id');
    }
}
