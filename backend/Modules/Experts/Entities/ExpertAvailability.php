<?php

namespace Modules\Experts\Entities;

use App\Models\Model;

class ExpertAvailability extends Model
{
    protected $table = 'expert_availability';

    public $timestamps = false;

    protected $fillable = [
        'expert_id',
        'expert_type',
        'current_status',
        'is_available',
        'status_message',
        'next_available_at',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'next_available_at' => 'datetime',
    ];
}
