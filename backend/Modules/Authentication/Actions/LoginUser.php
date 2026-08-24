<?php

namespace Modules\Authentication\Actions;

use App\Models\User;
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

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
