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

        // Enforce 2FA when enabled — issue a short-lived pending token only.
        $twoFactor = \Modules\Authentication\Entities\TwoFactorSecret::where('user_id', $user->id)
            ->where('enabled', true)
            ->first();

        if ($twoFactor) {
            $pendingToken = \Illuminate\Support\Str::random(60);
            cache()->put("2fa_pending:{$pendingToken}", $user->id, 300);

            return [
                'requires_2fa' => true,
                'pending_token' => $pendingToken,
                'user' => $user,
            ];
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
