<?php

namespace Modules\Experts\Entities;

use App\Models\Model;

class ExpertWishlist extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'expert_id',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
