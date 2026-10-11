<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class LabTest extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'category',
        'price',
        'preparation_instructions',
        'result_time_hours',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'result_time_hours' => 'integer',
        'is_active' => 'boolean',
    ];

    public function bookings()
    {
        return $this->hasMany(LabBooking::class, 'lab_test_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
