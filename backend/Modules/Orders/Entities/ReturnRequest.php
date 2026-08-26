<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class ReturnRequest extends Model
{
    protected $fillable = [
        'order_id',
        'order_item_id',
        'user_id',
        'vendor_id',
        'reason',
        'description',
        'status',
        'refund_amount',
        'admin_notes',
    ];

    protected $casts = [
        'refund_amount' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function vendor()
    {
        return $this->belongsTo(\Modules\Vendors\Entities\Vendor::class);
    }
}
