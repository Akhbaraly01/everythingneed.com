<?php

namespace Modules\Authentication\Actions;

use Modules\Authentication\Entities\OtpChallenge;
use Core\Exceptions\ValidationException;

class VerifyEmailOtp
{
    public function execute(string $email, string $code): bool
    {
        $challenge = OtpChallenge::where('email', strtolower(trim($email)))
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

        if (!\Illuminate\Support\Facades\Hash::check($code, $challenge->code)) {
            throw new ValidationException('Invalid verification code');
        }

        $challenge->update(['verified' => true]);

        return true;
    }
}
