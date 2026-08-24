<?php

namespace Modules\Messaging\Entities;

use App\Models\Model;

class ChatConversation extends Model
{
    protected $fillable = [
        'customer_id',
        'worker_id',
        'booking_id',
    ];

    public function customer()
    {
        return $this->belongsTo(\App\Models\User::class, 'customer_id');
    }

    public function worker()
    {
        return $this->belongsTo(\App\Models\User::class, 'worker_id');
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }
}
