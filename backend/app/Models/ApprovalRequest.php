<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

/**
 * Generic approval request (W4 engine). Approval history is append-only —
 * deliberately no SoftDeletes: rejected/approved records are audit evidence.
 */
class ApprovalRequest extends Model
{
    use HasUuid;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'type',
        'subject_type',
        'subject_id',
        'title',
        'payload',
        'status',
        'current_step',
        'requested_by',
        'decided_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'current_step' => 'integer',
        'decided_at' => 'datetime',
    ];

    public function steps()
    {
        return $this->hasMany(ApprovalStep::class, 'request_id')->orderBy('step_order');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
