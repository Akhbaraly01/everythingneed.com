<?php

namespace Modules\Authentication\Actions;

use Modules\Authentication\Entities\OtpChallenge;
use Core\Exceptions\ValidationException;
use Illuminate\Support\Facades\Hash;

class VerifyOtp
{
    public function execute(string $phone, string $code): bool
    {
        $challenge = OtpChallenge::where('phone', $phone)
            ->where('verified', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$challenge) {
            throw new ValidationException('Invalid or expired OTP');
        }

        if ($challenge->isMaxAttemptsReached()) {
            throw new ValidationException('Maximum attempts reached. Please request a new code.');
        }

        $challenge->increment('attempts');

        if (!Hash::check($code, $challenge->code)) {
            throw new ValidationException('Invalid verification code');
        }

        $challenge->update(['verified' => true]);

        return true;
    }
}
