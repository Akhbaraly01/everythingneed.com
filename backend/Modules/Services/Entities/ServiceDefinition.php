<?php

namespace Modules\Services\Entities;

use App\Models\Model;

class ServiceDefinition extends Model
{
    protected $fillable = [
        'name',
        'category',
        'category_id',
        'description',
        'image_url',
        'provider',
        'pricing_mode',
        'base_price',
        'currency',
        'location',
        'availability',
        'requires_booking',
        'booking_fields',
        'documents',
        'requires_payment',
        'cancellation_rules',
        'delivery_rules',
        'status',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'availability' => 'array',
        'requires_booking' => 'boolean',
        'booking_fields' => 'array',
        'documents' => 'array',
        'requires_payment' => 'boolean',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_DRAFT = 'draft';
    const STATUS_INACTIVE = 'inactive';

    public function bookings()
    {
        return $this->hasMany(ServiceBooking::class, 'service_id');
    }

    /** Taxonomy link (M-1); `category` stays as the display/legacy string. */
    public function categoryRef()
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id');
    }
}
