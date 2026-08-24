<?php

namespace Modules\Engagement\Entities;

use App\Models\Model;

class Favorite extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'entity_type',
        'entity_id',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
