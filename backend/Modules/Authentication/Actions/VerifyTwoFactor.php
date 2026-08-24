<?php

namespace Modules\Authentication\Actions;

use App\Models\User;
use Modules\Authentication\Entities\TwoFactorSecret;
use Core\Exceptions\ValidationException;

class VerifyTwoFactor
{
    public function execute(string $userId, string $code): bool
    {
        $twoFactor = TwoFactorSecret::where('user_id', $userId)->first();

        if (!$twoFactor) {
            throw new ValidationException('Two-factor authentication not configured');
        }

        if (strlen($code) !== 6 || !ctype_digit($code)) {
            throw new ValidationException('Invalid two-factor code format');
        }

        // Time-based TOTP verification (30-second window, ±1 step tolerance)
        $key = self::base32Decode($twoFactor->secret);
        $time = floor(time() / 30);
        $valid = false;

        for ($i = -1; $i <= 1; $i++) {
            $counter = pack('N*', 0) . pack('N*', (int) ($time + $i));
            $hash = hash_hmac('sha1', $counter, $key, true);
            $offset = ord($hash[19]) & 0xf;
            $otp = (
                ((ord($hash[$offset]) & 0x7f) << 24) |
                ((ord($hash[$offset + 1]) & 0xff) << 16) |
                ((ord($hash[$offset + 2]) & 0xff) << 8) |
                (ord($hash[$offset + 3]) & 0xff)
            ) % 1000000;

            if (hash_equals(str_pad((string) $otp, 6, '0', STR_PAD_LEFT), $code)) {
                $valid = true;
                break;
            }
        }

        if (!$valid) {
            throw new ValidationException('Invalid two-factor code');
        }

        if (!$twoFactor->enabled) {
            $twoFactor->update([
                'enabled' => true,
                'verified_at' => now(),
            ]);
        }

        return true;
    }

    private static function base32Decode(string $input): string
    {
        $map = [
            'A' => 0, 'B' => 1, 'C' => 2, 'D' => 3, 'E' => 4, 'F' => 5,
            'G' => 6, 'H' => 7, 'I' => 8, 'J' => 9, 'K' => 10, 'L' => 11,
            'M' => 12, 'N' => 13, 'O' => 14, 'P' => 15, 'Q' => 16, 'R' => 17,
            'S' => 18, 'T' => 19, 'U' => 20, 'V' => 21, 'W' => 22, 'X' => 23,
            'Y' => 24, 'Z' => 25, '2' => 26, '3' => 27, '4' => 28, '5' => 29,
            '6' => 30, '7' => 31,
        ];

        $input = strtoupper(rtrim($input, '='));
        $buffer = 0;
        $bitsLeft = 0;
        $output = '';

        for ($i = 0; $i < strlen($input); $i++) {
            $val = $map[$input[$i]] ?? -1;
            if ($val < 0) {
                continue;
            }
            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;
            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $output .= chr(($buffer >> $bitsLeft) & 0xff);
            }
        }

        return $output;
    }
}
