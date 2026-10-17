<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedOffer extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_WITHDRAWN = 'withdrawn';
    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'need_request_id',
        'provider_id',
        'price',
        'message',
        'status',
        'scope_of_work',
        'deliverables',
        'exclusions',
        'estimated_duration',
        'terms',
        'expires_at',
        'revision_no',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'expires_at' => 'datetime',
        'revision_no' => 'integer',
    ];

    public function request()
    {
        return $this->belongsTo(NeedRequest::class, 'need_request_id');
    }

    public function provider()
    {
        return $this->belongsTo(\App\Models\User::class, 'provider_id');
    }

    public function revisions()
    {
        return $this->hasMany(NeedOfferRevision::class, 'need_offer_id')
            ->orderBy('revision_no');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
