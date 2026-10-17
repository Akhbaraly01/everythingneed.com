<?php

namespace Modules\Needs\Entities;

use App\Models\Model;
use Core\Support\HasSlug;

class NeedItem extends Model
{
    use HasSlug;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_ARCHIVED = 'archived';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_SUBMITTED,
        self::STATUS_APPROVED,
        self::STATUS_PUBLISHED,
        self::STATUS_REJECTED,
        self::STATUS_SUSPENDED,
        self::STATUS_ARCHIVED,
    ];

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'image_url',
        'is_available',
        'vendor_id',
        'user_id',
        'status',
        'packages',
        'deliverables',
        'exclusions',
        'add_ons',
        'estimated_duration',
        'requirements',
        'cancellation_terms',
        'revision_policy',
        'review_note',
        'published_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
        'packages' => 'array',
        'add_ons' => 'array',
        'published_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(NeedCategory::class, 'category_id');
    }

    public function vendor()
    {
        return $this->belongsTo(\Modules\Vendors\Entities\Vendor::class);
    }

    public function owner()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function isPubliclyVisible(): bool
    {
        return $this->status === self::STATUS_PUBLISHED && (bool) $this->is_available;
    }
}
