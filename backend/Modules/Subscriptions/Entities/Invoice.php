<?php

namespace Modules\Subscriptions\Entities;

use App\Models\Model;

class Invoice extends Model
{
    protected $fillable = [
        'subscription_id',
        'user_id',
        'amount',
        'currency',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PAID = 'paid';
    const STATUS_FAILED = 'failed';
    const STATUS_REFUNDED = 'refunded';

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
