<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedScopeChange extends Model
{
    protected $table = 'need_scope_changes';

    public const STATUS_PROPOSED = 'proposed';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'need_request_id',
        'requested_by',
        'summary',
        'price_effect',
        'time_effect',
        'status',
        'decided_by',
        'decided_at',
    ];

    protected $casts = [
        'price_effect' => 'decimal:2',
        'decided_at' => 'datetime',
    ];

    public function request()
    {
        return $this->belongsTo(NeedRequest::class, 'need_request_id');
    }

    public function requester()
    {
        return $this->belongsTo(\App\Models\User::class, 'requested_by');
    }
}
