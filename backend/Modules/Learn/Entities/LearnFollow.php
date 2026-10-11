<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnFollow extends Model
{
    protected $fillable = ['follower_id', 'creator_id'];

    public function follower()
    {
        return $this->belongsTo(\App\Models\User::class, 'follower_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'creator_id');
    }
}
