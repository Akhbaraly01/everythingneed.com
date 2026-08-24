<?php

namespace Modules\Reviews\Entities;

use App\Models\Model;

class ReviewVote extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'review_id',
        'user_id',
        'is_helpful',
    ];

    protected $casts = [
        'is_helpful' => 'boolean',
    ];

    public function review()
    {
        return $this->belongsTo(Review::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
