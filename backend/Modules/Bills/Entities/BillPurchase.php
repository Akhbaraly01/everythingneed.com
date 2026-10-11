<?php

namespace Modules\Bills\Entities;

use App\Models\Model;

class BillPurchase extends Model
{
    protected $fillable = [
        'user_id',
        'service',
        'provider',
        'country',
        'currency',
        'amount',
        'account_fields',
        'reference',
        'idempotency_key',
        'status',
        'provider_reference',
        'provider_response',
        'wallet_refunded',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'account_fields' => 'array',
        'provider_response' => 'array',
        'wallet_refunded' => 'boolean',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_SUCCEEDED = 'succeeded';
    const STATUS_FAILED = 'failed';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
