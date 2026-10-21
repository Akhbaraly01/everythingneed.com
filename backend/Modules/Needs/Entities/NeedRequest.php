<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedRequest extends Model
{
    // Spec S13 lifecycle - the full vocabulary. `pending` doubles as
    // "Submitted" (the pinned create contract) and `in_progress` as
    // "Processing"; `reviewing`/`offered` are the internal offer states
    // behind "Offers Received".
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING = 'pending';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_REVIEWING = 'reviewing';
    public const STATUS_OFFERED = 'offered';
    public const STATUS_NEGOTIATING = 'negotiating';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_PAYMENT_PENDING = 'payment_pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_FULFILLED = 'fulfilled';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_DISPUTED = 'disputed';
    public const STATUS_REFUNDED = 'refunded';

    /** Statuses shown in the public open-request marketplace. */
    public const OPEN_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PUBLISHED,
        self::STATUS_REVIEWING,
        self::STATUS_OFFERED,
        self::STATUS_NEGOTIATING,
    ];

    protected $fillable = [
        'user_id',
        'category_id',
        'request_number',
        'title',
        'description',
        'subcategory',
        'budget_min',
        'budget_max',
        'quantity',
        'currency',
        'country',
        'location',
        'preferred_date',
        'deadline',
        'attachments',
        'images',
        'service_requirements',
        'delivery_requirements',
        'notes',
        'status',
        'answers',
        'form_schema_snapshot',
        'form_schema_version',
        'selected_listing_id',
        'selected_package',
        'pricing_basis',
        'is_remote',
        'state',
        'lga',
        'city',
        'is_asap',
        'preferred_time_window',
        'visibility',
        'invited_provider_ids',
        'client_key',
        'agreed_price_override',
    ];

    protected $casts = [
        'attachments' => 'array',
        'images' => 'array',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'quantity' => 'integer',
        'preferred_date' => 'date',
        'deadline' => 'date',
        'answers' => 'array',
        'form_schema_snapshot' => 'array',
        'form_schema_version' => 'integer',
        'selected_package' => 'array',
        'is_remote' => 'boolean',
        'is_asap' => 'boolean',
        'invited_provider_ids' => 'array',
    ];

    /** Pricing models a request can declare (§7 step 4). */
    public const PRICING_FIXED = 'fixed';
    public const PRICING_RANGE = 'range';
    public const PRICING_HOURLY = 'hourly';
    public const PRICING_PER_ITEM = 'per_item';
    public const PRICING_QUOTE = 'quote';
    public const PRICING_INSPECTION = 'inspection';
    public const PRICING_FLEXIBLE = 'flexible';

    public const PRICING_BASES = [
        self::PRICING_FIXED,
        self::PRICING_RANGE,
        self::PRICING_HOURLY,
        self::PRICING_PER_ITEM,
        self::PRICING_QUOTE,
        self::PRICING_INSPECTION,
        self::PRICING_FLEXIBLE,
    ];

    /** Visibility modes (§7 step 7). invite_only is enforced, not labeled. */
    public const VISIBILITY_PUBLIC = 'public';
    public const VISIBILITY_INVITE_ONLY = 'invite_only';

    public function isProviderInvited(string $userId): bool
    {
        return in_array($userId, $this->invited_provider_ids ?? [], true);
    }

    public function offers()
    {
        return $this->hasMany(NeedOffer::class);
    }

    public function acceptedOffer()
    {
        return $this->hasOne(NeedOffer::class)
            ->where('status', NeedOffer::STATUS_ACCEPTED);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function category()
    {
        return $this->belongsTo(NeedCategory::class, 'category_id');
    }

    public function events()
    {
        return $this->hasMany(NeedRequestEvent::class, 'need_request_id')
            ->orderByDesc('created_at');
    }

    /** P0 needs console: needs-scoped disputes (shared disputes table). */
    public function disputes()
    {
        return $this->hasMany(\Modules\Orders\Entities\Dispute::class, 'need_request_id')
            ->orderByDesc('created_at');
    }

    /** N-20: the milestone escrow ledger of this request. */
    public function milestones()
    {
        return $this->hasMany(NeedMilestone::class, 'need_request_id')->orderBy('sequence');
    }

    /** N-25: the hourly timesheet ledger of this request. */
    public function timesheets()
    {
        return $this->hasMany(NeedTimesheet::class, 'need_request_id')->orderBy('work_date');
    }
}
