<?php

namespace Modules\Admin\Entities;

use App\Models\Uuid7Model;

class DynamicModuleEntry extends Uuid7Model
{
    protected $table = 'dynamic_module_entries';

    /** The entries table carries no timestamp columns. */
    public $timestamps = false;

    protected $casts = [
        'data' => 'array',
    ];

    public function module()
    {
        return $this->belongsTo(DynamicModule::class, 'module_id');
    }
}
