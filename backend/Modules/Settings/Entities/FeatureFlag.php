<?php

namespace Modules\Settings\Entities;

use App\Models\Model;

class FeatureFlag extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
        'is_enabled',
        'default_value',
        'conditions',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'default_value' => 'boolean',
        'conditions' => 'array',
    ];
}
