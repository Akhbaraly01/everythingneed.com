<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnPostSave extends Model
{
    protected $fillable = ['post_id', 'user_id'];

    public function post()
    {
        return $this->belongsTo(LearnPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
