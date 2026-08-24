<?php

namespace Modules\Payments\Entities;

use App\Models\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'user_id',
        'amount',
        'currency',
        'status',
        'method',
        'reference',
        'gateway_response',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_SUCCEEDED = 'succeeded';
    const STATUS_FAILED = 'failed';
    const STATUS_REFUNDED = 'refunded';
    const STATUS_PARTIALLY_REFUNDED = 'partially_refunded';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }
}
