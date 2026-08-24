<?php

namespace Modules\Reviews\Entities;

use App\Models\Model;

class Review extends Model
{
    protected $fillable = [
        'user_id',
        'reviewable_type',
        'reviewable_id',
        'rating',
        'title',
        'comment',
        'is_verified_purchase',
        'helpful_count',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_verified_purchase' => 'boolean',
        'helpful_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function reviewable()
    {
        return $this->morphTo();
    }
}
