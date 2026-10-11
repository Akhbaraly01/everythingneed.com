<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

/** One approval step: approver_role null = any permission-holding approver. */
class ApprovalStep extends Model
{
    use HasUuid;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_SKIPPED = 'skipped';

    protected $fillable = [
        'request_id',
        'step_order',
        'approver_role',
        'status',
        'decided_by',
        'decided_at',
        'comment',
    ];

    protected $casts = [
        'step_order' => 'integer',
        'decided_at' => 'datetime',
    ];

    public function request()
    {
        return $this->belongsTo(ApprovalRequest::class, 'request_id');
    }
}
