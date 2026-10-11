<?php

namespace Modules\Authentication\Actions;

use Core\Services\OtpSender;
use Modules\Authentication\Entities\OtpChallenge;
use Illuminate\Support\Facades\Hash;

class RequestEmailOtp
{
    public function __construct(private OtpSender $sender) {}

    public function execute(string $email): array
    {
        $email = strtolower(trim($email));
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        OtpChallenge::where('email', $email)->where('verified', false)->delete();

        $challenge = OtpChallenge::create([
            'email' => $email,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'verified' => false,
        ]);

        // Delivery disabled by design — no mail is sent (see OtpSender).
        $this->sender->send('mail', $email, $code);

        return [
            'challenge_id' => $challenge->id,
            'expires_at' => $challenge->expires_at,
            // Only return code in development
            'code' => app()->isLocal() ? $code : null,
        ];
    }
}
