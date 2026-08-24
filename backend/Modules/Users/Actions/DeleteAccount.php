<?php

namespace Modules\Users\Actions;

use App\Models\User;
use Core\Exceptions\NotFoundException;

class DeleteAccount
{
    public function execute(string $userId): bool
    {
        $user = User::find($userId);

        if (!$user) {
            throw new NotFoundException('User', $userId);
        }

        $user->delete();

        return true;
    }
}
