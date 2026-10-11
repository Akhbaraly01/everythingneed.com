<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class AidDonation extends Model
{
    protected $fillable = [
        'aid_request_id',
        'donor_id',
        'amount',
        'currency',
        'payment_id',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    public function aidRequest()
    {
        return $this->belongsTo(AidRequest::class, 'aid_request_id');
    }

    public function donor()
    {
        return $this->belongsTo(\App\Models\User::class, 'donor_id');
    }

    public function payment()
    {
        return $this->belongsTo(\Modules\Payments\Entities\Payment::class, 'payment_id');
    }
}
