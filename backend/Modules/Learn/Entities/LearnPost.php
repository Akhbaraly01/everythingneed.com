<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnPost extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'content',
        'category',
        'media_type',
        'media_url',
        'thumbnail_url',
        'video_url',
        'duration_minutes',
        'author_name',
        'author_avatar',
        'likes_count',
        'comments_count',
        'shares_count',
        'is_featured',
        'status',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'likes_count' => 'integer',
        'comments_count' => 'integer',
        'shares_count' => 'integer',
        'is_featured' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function comments()
    {
        return $this->hasMany(LearnPostComment::class, 'post_id');
    }

    public function likes()
    {
        return $this->hasMany(LearnPostLike::class, 'post_id');
    }
}
