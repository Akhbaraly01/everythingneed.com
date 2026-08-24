<?php

namespace Modules\Subscriptions\Entities;

use App\Models\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'status',
        'starts_at',
        'ends_at',
        'cancelled_at',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_EXPIRED = 'expired';
    const STATUS_PAUSED = 'paused';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
