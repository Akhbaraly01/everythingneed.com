<?php

namespace Modules\Delivery\Entities;

use App\Models\Model;

class DeliveryManager extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'vehicle_type',
        'is_available',
        'completed_deliveries',
        'rating',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'completed_deliveries' => 'integer',
        'rating' => 'decimal:1',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
