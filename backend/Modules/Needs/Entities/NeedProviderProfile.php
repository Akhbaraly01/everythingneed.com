<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedProviderProfile extends Model
{
    protected $table = 'need_provider_profiles';

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_TRIAL = 'trial';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_SUSPENDED = 'suspended';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_SUBMITTED,
        self::STATUS_TRIAL,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
        self::STATUS_SUSPENDED,
    ];

    protected $fillable = [
        'user_id',
        'display_name',
        'bio',
        'category_ids',
        'service_areas',
        'qualifications',
        'evidence_urls',
        'status',
        'is_available',
        'review_note',
        'reviewed_by',
        'reviewed_at',
        'trial_started_at',
    ];

    protected $casts = [
        'category_ids' => 'array',
        'service_areas' => 'array',
        'qualifications' => 'array',
        'evidence_urls' => 'array',
        'is_available' => 'boolean',
        'reviewed_at' => 'datetime',
        'trial_started_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(\App\Models\User::class, 'reviewed_by');
    }

    /**
     * Trial stage: screened and provisionally watched (N-23). Trial
     * providers work like any user on non-verified categories, but are NOT
     * eligible for verified categories (isEligible) and are excluded from
     * auto-matching (NeedMatcher) until approval.
     */
    public function isTrial(): bool
    {
        return $this->status === self::STATUS_TRIAL;
    }

    /**
     * Platform approval only. Identity is proven by KYC (KycGate), never by
     * this row — §9 keeps the two checks distinct on purpose.
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /**
     * N-27 live availability: the provider's own pause switch, fully
     * independent of vetting status — an approved provider who is away
     * simply drops out of matching until they flip it back.
     */
    public function isAvailable(): bool
    {
        return (bool) $this->is_available;
    }

    /**
     * Full eligibility for verification-demanding categories: approved
     * profile AND a verified KYC identity. Deliberately excludes trial —
     * the verified badge is earned, never provisional.
     */
    public static function isEligible(string $userId): bool
    {
        $profile = self::where('user_id', $userId)->first();

        return $profile !== null
            && $profile->isApproved()
            && \Core\Support\KycGate::isVerified($userId);
    }

    public static function isSuspended(string $userId): bool
    {
        return self::where('user_id', $userId)
            ->where('status', self::STATUS_SUSPENDED)
            ->exists();
    }
}
