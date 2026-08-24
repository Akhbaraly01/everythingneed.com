<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnPostComment extends Model
{
    protected $fillable = [
        'post_id',
        'user_id',
        'content',
    ];

    public function post()
    {
        return $this->belongsTo(LearnPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
