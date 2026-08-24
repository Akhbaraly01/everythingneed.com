<?php

namespace Modules\Payments\Entities;

use App\Models\Model;

class Refund extends Model
{
    protected $fillable = [
        'payment_id',
        'amount',
        'reason',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_COMPLETED = 'completed';

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}
