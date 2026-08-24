<?php

namespace Modules\Users\Actions;

use App\Models\User;
use Core\Exceptions\NotFoundException;

class UpdateProfile
{
    public function execute(string $userId, array $data): object
    {
        $user = User::find($userId);

        if (!$user) {
            throw new NotFoundException('User', $userId);
        }

        $profile = $user->profile;

        if ($profile) {
            $profile->update($data);
        } else {
            $profile = $user->profile()->create($data);
        }

        return $profile->fresh();
    }
}
