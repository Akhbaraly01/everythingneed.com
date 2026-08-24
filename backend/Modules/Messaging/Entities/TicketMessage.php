<?php

namespace Modules\Messaging\Entities;

use App\Models\Model;

class TicketMessage extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'ticket_id',
        'sender_id',
        'message',
        'is_internal',
        'created_at',
    ];

    protected $casts = [
        'is_internal' => 'boolean',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function sender()
    {
        return $this->belongsTo(\App\Models\User::class, 'sender_id');
    }
}
