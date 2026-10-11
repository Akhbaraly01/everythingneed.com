<?php

namespace Modules\Payments\Entities;

use App\Models\Model;

class Payment extends Model
{
    public function order()
    {
        return $this->belongsTo(\Modules\Orders\Entities\Order::class, 'order_id');
    }

    protected $fillable = [
        'order_id',
        'user_id',
        'amount',
        'currency',
        'status',
        'method',
        'reference',
        'purpose',
        'gateway_response',
        'idempotency_key',
        'metadata',
        'provider',
        'provider_payment_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
        'metadata' => 'array',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_SUCCEEDED = 'succeeded';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';
    const STATUS_PARTIALLY_REFUNDED = 'partially_refunded';
    const STATUS_COMPLETED = 'completed';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }
}
