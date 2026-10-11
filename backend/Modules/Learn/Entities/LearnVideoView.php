<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

/**
 * Per-user watch heartbeat for feed/course videos. Rows are upserted by the
 * authenticated viewer so watch time accumulates instead of being
 * overwritten, and completion always requires accumulated evidence.
 */
class LearnVideoView extends Model
{
    protected $fillable = [
        'post_id',
        'user_id',
        'watch_seconds',
        'completed',
    ];

    protected $casts = [
        'watch_seconds' => 'integer',
        'completed' => 'boolean',
    ];

    public function post()
    {
        return $this->belongsTo(LearnPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
