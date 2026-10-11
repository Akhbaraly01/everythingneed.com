<?php

namespace Modules\Vendors\Entities;

use App\Models\Model;

/**
 * Spec §34 vendor services: a vendor-owned service catalog surfaced at
 * /vendors/{slug}/services and managed at /vendor/services. Customers book
 * these rows through the existing `bookings` table (service_type
 * = 'vendor_service').
 */
class VendorService extends Model
{
    protected $fillable = [
        'vendor_id',
        'name',
        'description',
        'price',
        'duration_minutes',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'duration_minutes' => 'integer',
        'is_active' => 'boolean',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }
}
