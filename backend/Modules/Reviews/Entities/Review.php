<?php

namespace Modules\Reviews\Entities;

use App\Models\Model;
use Illuminate\Database\Eloquent\Builder;

class Review extends Model
{
    /** Moderation lifecycle (L-B.5). Legacy rows backfill to `approved`. */
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PENDING = 'pending';
    public const STATUS_HIDDEN = 'hidden';
    public const STATUS_REJECTED = 'rejected';

    public const STATUSES = [
        self::STATUS_APPROVED,
        self::STATUS_PENDING,
        self::STATUS_HIDDEN,
        self::STATUS_REJECTED,
    ];

    /** What the public read endpoints ever return. */
    public const VISIBLE_STATUSES = [self::STATUS_APPROVED];

    protected $fillable = [
        'user_id',
        'reviewable_type',
        'reviewable_id',
        'rating',
        'title',
        'comment',
        'is_verified_purchase',
        'helpful_count',
        'status',
        'moderated_by',
        'moderated_at',
        'moderation_reason',
        'provider_response',
        'responded_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_verified_purchase' => 'boolean',
        'helpful_count' => 'integer',
        'moderated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function moderator()
    {
        return $this->belongsTo(\App\Models\User::class, 'moderated_by');
    }

    public function reviewable()
    {
        return $this->morphTo();
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->whereIn('status', self::VISIBLE_STATUSES);
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }
}
