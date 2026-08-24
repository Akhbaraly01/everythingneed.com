<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnDirectMessage extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'message',
        'post_id',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function sender()
    {
        return $this->belongsTo(\App\Models\User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(\App\Models\User::class, 'receiver_id');
    }

    public function post()
    {
        return $this->belongsTo(LearnPost::class, 'post_id');
    }
}
