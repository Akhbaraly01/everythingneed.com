<?php

namespace Modules\Vendors\Actions;

use App\Models\User;
use Modules\Vendors\Entities\Vendor;
use Core\Exceptions\ValidationException;

class RegisterVendor
{
    public function execute(string $userId, array $data): object
    {
        $existingVendor = Vendor::where('user_id', $userId)->first();

        if ($existingVendor) {
            throw new ValidationException('User is already a vendor');
        }

        return Vendor::create(array_merge($data, ['user_id' => $userId]));
    }
}
