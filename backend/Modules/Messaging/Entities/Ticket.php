<?php

namespace Modules\Messaging\Entities;

use App\Models\Model;

class Ticket extends Model
{
    protected $fillable = [
        'user_id',
        'ticket_number',
        'subject',
        'description',
        'priority',
        'status',
        'assigned_to',
        'department_id',
    ];

    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';

    const STATUS_OPEN = 'open';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_PENDING = 'pending';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_CLOSED = 'closed';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function assignee()
    {
        return $this->belongsTo(\App\Models\User::class, 'assigned_to');
    }

    public function department()
    {
        return $this->belongsTo(\Modules\Messaging\Entities\Department::class);
    }

    public function messages()
    {
        return $this->hasMany(TicketMessage::class, 'ticket_id');
    }
}
