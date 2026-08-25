<?php

namespace Modules\Authentication\Actions;

use App\Models\User;
use Core\Exceptions\ForbiddenException;
use Core\Exceptions\UnauthorizedException;
use Illuminate\Support\Facades\Hash;

class LoginUser
{
    public function execute(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Suspended accounts are locked out of new sessions entirely.
        if ($user->suspended_at) {
            throw new ForbiddenException(
                'This account has been suspended. Contact support for assistance.'
            );
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
