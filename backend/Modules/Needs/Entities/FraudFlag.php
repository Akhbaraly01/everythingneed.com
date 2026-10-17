<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class FraudFlag extends Model
{
    protected $table = 'fraud_flags';

    protected $fillable = [
        'rule',
        'entity_type',
        'entity_id',
        'user_id',
        'details',
        'status',
        'decided_by',
        'decision_note',
        'decided_at',
    ];

    protected $casts = [
        'details' => 'array',
        'decided_at' => 'datetime',
    ];

    public const STATUS_OPEN = 'open';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_DISMISSED = 'dismissed';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function decider()
    {
        return $this->belongsTo(\App\Models\User::class, 'decided_by');
    }
}
