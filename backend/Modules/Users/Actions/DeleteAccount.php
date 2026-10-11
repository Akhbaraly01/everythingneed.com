<?php

namespace Modules\Users\Actions;

use App\Models\User;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;
use Illuminate\Support\Facades\Hash;

class DeleteAccount
{
    public function execute(string $userId, string $password): bool
    {
        $user = User::find($userId);

        if (!$user) {
            throw new NotFoundException('User', $userId);
        }

        if (!Hash::check($password, $user->password)) {
            throw new ValidationException('Password is incorrect.', ['password' => ['Password is incorrect.']]);
        }

        $user->tokens()->delete();
        $user->delete();

        return true;
    }
}
