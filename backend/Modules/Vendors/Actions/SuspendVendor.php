<?php

namespace Modules\Vendors\Actions;

use Modules\Vendors\Entities\Vendor;
use Core\Exceptions\NotFoundException;

class SuspendVendor
{
    public function execute(string $vendorId, ?string $reason = null): object
    {
        $vendor = Vendor::find($vendorId);

        if (!$vendor) {
            throw new NotFoundException('Vendor', $vendorId);
        }

        $vendor->update(['is_verified' => false]);

        return $vendor->fresh();
    }
}
