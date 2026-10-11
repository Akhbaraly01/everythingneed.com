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

        // Contact/business details live in the settings JSON bag (no
        // dedicated columns) so the registration form values persist.
        $settings = [];
        foreach (['business_type', 'phone', 'address'] as $key) {
            if (isset($data[$key]) && $data[$key] !== '') {
                $settings[$key] = $data[$key];
                unset($data[$key]);
            }
        }
        if ($settings !== []) {
            $data['settings'] = array_merge($data['settings'] ?? [], $settings);
        }

        return Vendor::create(array_merge($data, ['user_id' => $userId]));
    }
}
