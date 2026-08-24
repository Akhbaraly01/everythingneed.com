<?php

namespace Modules\Authentication\Entities;

use App\Models\Model;

class Session extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'payload',
        'last_activity',
    ];

    protected $casts = [
        'last_activity' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
