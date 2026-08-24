<?php

namespace Modules\Analytics\Entities;

use App\Models\Model;

class AnalyticsEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'event_type',
        'entity_type',
        'entity_id',
        'user_id',
        'properties',
        'session_id',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
