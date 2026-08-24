<?php

namespace Modules\Categories\Entities;

use App\Models\Model;

class Category extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
        'icon',
        'image_url',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }
}
