<?php

namespace Core\Services;

use Illuminate\Support\Facades\Log;

/**
 * OTP delivery seam.
 *
 * Sending is intentionally DISABLED: neither SMS nor mail is dispatched.
 * Codes are issued and verified locally (see RequestOtp / RequestEmailOtp,
 * which expose the code only outside production). When a real provider is
 * wired, implement delivery here behind config — never inline in actions.
 */
class OtpSender
{
    public function send(string $channel, string $destination, string $code): void
    {
        Log::debug('OTP issued (delivery disabled — no SMS or mail sent).', [
            'channel' => $channel,
        ]);

        // Future providers plug in here, e.g.:
        // if ($channel === 'sms') { ... }
        // if ($channel === 'mail' && config('verification.mail_enabled')) { ... }
        unset($destination, $code);
    }
}
