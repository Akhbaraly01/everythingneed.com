<?php

namespace Modules\Users\Actions;

use App\Models\User;
use Modules\Users\Entities\Address;
use Core\Exceptions\NotFoundException;

class AddAddress
{
    public function execute(string $userId, array $data): object
    {
        $user = User::find($userId);

        if (!$user) {
            throw new NotFoundException('User', $userId);
        }

        if ($data['is_default'] ?? false) {
            $user->addresses()->update(['is_default' => false]);
        }

        $address = $user->addresses()->create($data);

        if (!$user->addresses()->where('is_default', true)->exists()) {
            $address->update(['is_default' => true]);
        }

        return $address->fresh();
    }
}
