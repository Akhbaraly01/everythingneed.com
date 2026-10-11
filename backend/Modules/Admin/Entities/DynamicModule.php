<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class DynamicModule extends Uuid7Model
{
    protected $table = 'dynamic_modules';

    protected $casts = [
        'fields' => 'array',
        'list_config' => 'array',
        'requires_approval' => 'boolean',
        'approval_roles' => 'array',
    ];

    public function entries()
    {
        return $this->hasMany(DynamicModuleEntry::class, 'module_id');
    }
}
