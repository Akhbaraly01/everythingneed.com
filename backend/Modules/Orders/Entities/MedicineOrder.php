<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class MedicineOrder extends Model
{
    protected $fillable = [
        'user_id',
        'order_number',
        'delivery_address',
        'prescription_url',
        'total_amount',
        'status',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PROCESSING = 'processing';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function items()
    {
        return $this->hasMany(MedicineOrderItem::class, 'order_id');
    }
}
