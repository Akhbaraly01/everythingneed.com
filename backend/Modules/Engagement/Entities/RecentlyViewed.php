<?php

namespace Modules\Engagement\Entities;

use App\Models\Model;

class RecentlyViewed extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'entity_type',
        'entity_id',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
