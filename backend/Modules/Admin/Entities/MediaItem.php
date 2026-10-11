<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class MediaItem extends Uuid7Model
{
    protected $table = 'media_library';

    protected $casts = [
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'meta' => 'array',
    ];
}
