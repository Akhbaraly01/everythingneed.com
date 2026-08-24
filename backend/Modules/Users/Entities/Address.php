<?php

namespace Modules\Users\Entities;

use App\Models\Model;

class Address extends Model
{
    protected $fillable = [
        'user_id',
        'line1',
        'line2',
        'city',
        'region',
        'postal_code',
        'country',
        'lat',
        'lng',
        'is_default',
    ];

    protected $casts = [
        'lat' => 'decimal:7',
        'lng' => 'decimal:7',
        'is_default' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
