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
    ];

    protected $casts = [
        'attachments' => 'array',
        'images' => 'array',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'quantity' => 'integer',
        'preferred_date' => 'date',
        'deadline' => 'date',
    ];

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
}
