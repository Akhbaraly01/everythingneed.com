<?php

namespace Modules\Authentication\Actions;

use App\Models\User;
use Modules\Authentication\Entities\OtpChallenge;
use Modules\Authentication\Entities\TwoFactorSecret;
class RegisterUser
{
    public function execute(array $data): array
    {
        $user = User::create([
            'email' => $data['email'],
            'password' => $data['password'],
            'name' => $data['full_name'] ?? $data['email'],
        ]);

        $user->profile()->create([
            'email' => $data['email'],
            'full_name' => $data['full_name'] ?? null,
        ]);

        $user->wallet()->create([
            'currency' => \Core\Support\Currencies::default(),
            'balance' => 0,
        ]);

        \App\Models\UserRole::firstOrCreate([
            'user_id' => $user->id,
            'role' => 'user',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
