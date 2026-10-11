<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnPostReport extends Model
{
    public const STATUS_OPEN = 'open';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_DISMISSED = 'dismissed';

    public const REASONS = [
        'spam', 'misinformation', 'harassment', 'off_topic',
        'copyright', 'unsafe', 'other',
    ];

    protected $fillable = [
        'post_id',
        'user_id',
        'reason',
        'details',
        'status',
        'handled_by',
        'handled_at',
    ];

    protected $casts = ['handled_at' => 'datetime'];

    public function post()
    {
        return $this->belongsTo(LearnPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function handler()
    {
        return $this->belongsTo(\App\Models\User::class, 'handled_by');
    }
}
