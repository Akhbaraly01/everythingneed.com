<?php

namespace Modules\Messaging\Entities;

use App\Models\Model;

class ChatMessage extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'message',
        'message_type',
        'is_read',
        'created_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function sender()
    {
        return $this->belongsTo(\App\Models\User::class, 'sender_id');
    }
}
