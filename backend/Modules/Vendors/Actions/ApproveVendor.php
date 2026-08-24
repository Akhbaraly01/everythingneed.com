<?php

namespace Modules\Vendors\Actions;

use Modules\Vendors\Entities\Vendor;
use Core\Exceptions\NotFoundException;

class ApproveVendor
{
    public function execute(string $vendorId): object
    {
        $vendor = Vendor::find($vendorId);

        if (!$vendor) {
            throw new NotFoundException('Vendor', $vendorId);
        }

        $vendor->update(['is_verified' => true]);

        return $vendor->fresh();
    }
}
