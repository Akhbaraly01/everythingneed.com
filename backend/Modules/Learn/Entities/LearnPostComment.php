<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnPostComment extends Model
{
    public const STATUS_VISIBLE = 'visible';
    public const STATUS_HIDDEN = 'hidden';

    protected $fillable = [
        'post_id',
        'user_id',
        'parent_id',
        'content',
        'likes_count',
        'status',
    ];

    protected $casts = [
        'likes_count' => 'integer',
    ];

    public function post()
    {
        return $this->belongsTo(LearnPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(self::class, 'parent_id')->where('status', self::STATUS_VISIBLE);
    }

    public function likes()
    {
        return $this->hasMany(LearnCommentLike::class, 'comment_id');
    }
}
