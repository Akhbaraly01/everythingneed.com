<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedRequest extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_REVIEWING = 'reviewing';
    public const STATUS_OFFERED = 'offered';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_PAID = 'paid';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'user_id',
        'category_id',
        'request_number',
        'title',
        'description',
        'budget_min',
        'budget_max',
        'location',
        'deadline',
        'attachments',
        'status',
    ];

    protected $casts = [
        'attachments' => 'array',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
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
}
