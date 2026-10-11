<?php

namespace Modules\Authentication\Actions;

use App\Models\User;
use Core\Services\OtpSender;
use Modules\Authentication\Entities\OtpChallenge;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RequestOtp
{
    public function __construct(private OtpSender $sender) {}

    public function execute(string $phone): array
    {
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $challenge = OtpChallenge::create([
            'phone' => $phone,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'verified' => false,
        ]);

        // Delivery disabled by design — no SMS is sent (see OtpSender).
        $this->sender->send('sms', $phone, $code);

        return [
            'challenge_id' => $challenge->id,
            'expires_at' => $challenge->expires_at,
            // Only return code in development
            'code' => app()->isLocal() ? $code : null,
        ];
    }
}
