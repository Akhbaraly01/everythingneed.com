<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnCommentLike extends Model
{
    protected $fillable = ['comment_id', 'user_id'];

    public function comment()
    {
        return $this->belongsTo(LearnPostComment::class, 'comment_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
