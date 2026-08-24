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
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(NeedItem::class, 'category_id');
    }
}
