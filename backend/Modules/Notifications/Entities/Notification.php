<?php

namespace Modules\Notifications\Entities;

use App\Models\Model;

class Notification extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'related_id',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
