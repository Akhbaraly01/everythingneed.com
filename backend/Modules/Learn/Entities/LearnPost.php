<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

/**
 * Feed post + moderation state machine (Learn 2.0, phase L-A).
 *
 *   draft -> pending -> under_review -> approved
 *                         |   |            |
 *                         |   +-> needs_information -> pending (resubmit)
 *                         +----> rejected --(appeal)--> pending
 *   approved <-> hidden (flagged/hide + restore); either -> removed
 *
 * `approved` is the only publicly visible state, which keeps the original
 * phase-16 contract (pending/rejected invisible) intact.
 */
class LearnPost extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING = 'pending';
    public const STATUS_UNDER_REVIEW = 'under_review';
    public const STATUS_NEEDS_INFO = 'needs_information';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_HIDDEN = 'hidden';
    public const STATUS_REMOVED = 'removed';

    public const VISIBLE_STATUSES = [self::STATUS_APPROVED];

    /** Video provenance values allowed on video_provider. */
    public const PROVIDERS = ['upload', 'youtube', 'vimeo', 'facebook'];

    /** Topical classes that demand a second reviewer pass before approval. */
    public const SENSITIVE_CATEGORIES = [
        'health', 'healthcare', 'medical', 'medicine', 'finance', 'financial',
        'investment', 'money', 'legal', 'law', 'pharmacy', 'drugs',
    ];

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'category',
        'media_type',
        'media_url',
        'thumbnail_url',
        'video_url',
        'duration_minutes',
        'author_name',
        'author_avatar',
        'likes_count',
        'comments_count',
        'shares_count',
        'is_featured',
        'status',
        'video_provider',
        'provider_video_id',
        'duration_seconds',
        'views_count',
        'slug',
        'language',
        'license',
        'sensitive_topic',
        'rejection_reason',
        'appeal_reason',
        'reviewed_by',
        'reviewed_at',
        'assigned_to',
        'submitted_at',
        'published_at',
        'is_pinned',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'likes_count' => 'integer',
        'comments_count' => 'integer',
        'shares_count' => 'integer',
        'is_featured' => 'boolean',
        'duration_seconds' => 'integer',
        'views_count' => 'integer',
        'sensitive_topic' => 'boolean',
        'is_pinned' => 'boolean',
        'reviewed_at' => 'datetime',
        'submitted_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(\App\Models\User::class, 'reviewed_by');
    }

    public function assignee()
    {
        return $this->belongsTo(\App\Models\User::class, 'assigned_to');
    }

    public function comments()
    {
        return $this->hasMany(LearnPostComment::class, 'post_id');
    }

    public function likes()
    {
        return $this->hasMany(LearnPostLike::class, 'post_id');
    }

    public function reports()
    {
        return $this->hasMany(LearnPostReport::class, 'post_id');
    }

    public function saves()
    {
        return $this->hasMany(LearnPostSave::class, 'post_id');
    }

    public function videoViews()
    {
        return $this->hasMany(LearnVideoView::class, 'post_id');
    }

    public function isPublic(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /** A second reviewer pass is required for health/finance/legal topics. */
    public function requiresSecondReview(): bool
    {
        return $this->sensitive_topic
            || (isset($this->category) && in_array(strtolower(trim($this->category)), self::SENSITIVE_CATEGORIES, true));
    }
}
