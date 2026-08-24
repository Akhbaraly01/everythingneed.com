<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedOffer extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_WITHDRAWN = 'withdrawn';

    protected $fillable = [
        'need_request_id',
        'provider_id',
        'price',
        'message',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function request()
    {
        return $this->belongsTo(NeedRequest::class, 'need_request_id');
    }

    public function provider()
    {
        return $this->belongsTo(\App\Models\User::class, 'provider_id');
    }
}
