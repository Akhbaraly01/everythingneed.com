<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class Dispute extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'need_request_id',
        'task_id',
        'subject',
        'description',
        'status',
        'resolution',
        'assigned_to',
        'resolution_notes',
        'previous_status',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function assignee()
    {
        return $this->belongsTo(\App\Models\User::class, 'assigned_to');
    }

    /** P0 needs console: needs/task-scoped disputes (order flow untouched). */
    public function needRequest()
    {
        return $this->belongsTo(\Modules\Needs\Entities\NeedRequest::class, 'need_request_id');
    }

    public function task()
    {
        return $this->belongsTo(\Modules\Needs\Entities\TaskPost::class, 'task_id');
    }

    public function evidence()
    {
        return $this->hasMany(DisputeEvidence::class, 'dispute_id')->orderBy('created_at');
    }
}
