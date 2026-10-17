<?php

namespace Modules\Authentication\Actions;

use App\Models\User;
use Modules\Authentication\Entities\TwoFactorSecret;
use Illuminate\Support\Str;

class EnableTwoFactor
{
    public function execute(string $userId): array
    {
        $user = User::findOrFail($userId);

        $secret = Str::random(32);

        $twoFactor = TwoFactorSecret::updateOrCreate(
            ['user_id' => $userId],
            [
                'secret' => $secret,
                'enabled' => false,
            ]
        );

        return [
            'secret' => $secret,
            'qr_code_url' => $this->generateQrCodeUrl($user->email, $secret),
        ];
    }

    private function generateQrCodeUrl(string $email, string $secret): string
    {
        return \Core\Support\TotpQrRenderer::dataUri($email, $secret);
    }
}
