<?php

namespace Modules\Authentication\Entities;

use App\Models\Model;

class TwoFactorSecret extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'secret',
        'enabled',
        'verified_at',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'verified_at' => 'datetime',
        // AES-256-GCM at rest (APP_KEY); security:encrypt-pii backfills rows
        // written before this cast existed.
        'secret' => 'encrypted',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
