<?php

namespace Modules\Rides\Entities;

use App\Models\Model;

class Vehicle extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'driver_id',
        'make',
        'model',
        'year',
        'color',
        'license_plate',
        'vehicle_type',
    ];

    protected $casts = [
        'year' => 'integer',
    ];

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }
}
