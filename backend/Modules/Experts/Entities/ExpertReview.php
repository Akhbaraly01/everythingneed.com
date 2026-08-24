<?php

namespace Modules\Experts\Entities;

use App\Models\Model;

class ExpertReview extends Model
{
    protected $fillable = [
        'expert_id',
        'user_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
