<?php

namespace Modules\BuildingServices\Entities;

use App\Models\Model;

class BuildingServiceBooking extends Model
{
    protected $fillable = [
        'user_id',
        'worker_id',
        'worker_type',
        'service_category',
        'description',
        'address',
        'scheduled_date',
        'scheduled_time',
        'estimated_cost',
        'quoted_price',
        'notes',
        'status',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'estimated_cost' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function worker()
    {
        return $this->belongsTo(ServiceWorker::class);
    }
}
