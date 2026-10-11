<?php

namespace Modules\Authentication\Entities;

use App\Models\Model;

class OtpChallenge extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'phone',
        'email',
        'code',
        'expires_at',
        'attempts',
        'verified',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'attempts' => 'integer',
        'verified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isMaxAttemptsReached(): bool
    {
        return $this->attempts >= 5;
    }
}
