<?php

namespace Modules\Subscriptions\Entities;

use App\Models\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'currency',
        'interval',
        'features',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
