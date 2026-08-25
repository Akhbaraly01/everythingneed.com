<?php

namespace Modules\Messaging\Entities;

use Illuminate\Database\Eloquent\Model;

class TicketEvent extends Model
{
    public const CREATED = 'created';
    public const STATUS_CHANGED = 'status_changed';
    public const DEPARTMENT_TRANSFERRED = 'department_transferred';
    public const ESCALATED = 'escalated';
    public const RATED = 'rated';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'ticket_id',
        'actor_id',
        'event_type',
        'payload',
        'created_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'created_at' => 'datetime',
    ];
}
