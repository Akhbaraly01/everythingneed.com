<?php

namespace Modules\Settings\Entities;

use App\Models\Model;

class UserSetting extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'json',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
