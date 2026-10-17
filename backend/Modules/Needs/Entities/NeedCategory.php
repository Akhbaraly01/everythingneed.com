<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedCategory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'color',
        'sort_order',
        'parent_id',
        'is_active',
        'form_schema',
        'form_schema_version',
        'requires_verified_provider',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'parent_id' => 'string',
        'is_active' => 'boolean',
        'form_schema' => 'array',
        'form_schema_version' => 'integer',
        'requires_verified_provider' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(NeedItem::class, 'category_id');
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }
}
