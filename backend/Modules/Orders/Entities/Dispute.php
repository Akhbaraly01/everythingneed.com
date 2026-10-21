<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class Dispute extends Model
{
    /** N-21 arbitration vocabulary for the award leg of a dispute. */
    public const ARBITRATION_PENDING = 'pending';
    public const ARBITRATION_AWARDED = 'awarded';
    public const ARBITRATION_SPLIT = 'split';
    public const ARBITRATION_REFUNDED = 'refunded';

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
        'need_milestone_id',
        'arbitration_status',
        'provider_award',
        'buyer_refund',
        'arbitrated_by',
        'arbitrated_at',
        'arbitration_notes',
    ];

    protected $casts = [
        'provider_award' => 'decimal:2',
        'buyer_refund' => 'decimal:2',
        'arbitrated_at' => 'datetime',
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

    /** N-21: the escrowed milestone this dispute arbitrates. */
    public function milestone()
    {
        return $this->belongsTo(\Modules\Needs\Entities\NeedMilestone::class, 'need_milestone_id');
    }

    public function arbitrator()
    {
        return $this->belongsTo(\App\Models\User::class, 'arbitrated_by');
    }
}
