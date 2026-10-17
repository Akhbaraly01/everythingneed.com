<?php

namespace Core\Support;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Facades\Crypt;

/**
 * Field-level PII cipher (AES-256-GCM via the app key).
 *
 * Used where Eloquent `encrypted` casts cannot reach (query-builder tables
 * like kyc_verifications) and by the security:encrypt-pii backfill, which
 * must read raw values without triggering cast decryption.
 *
 * Rotation: set APP_PREVIOUS_KEY to the retired key while re-encrypting;
 * decrypt() tries the current key first, then the previous one.
 */
class PiiCipher
{
    public static function encrypt(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return Crypt::encryptString($value);
    }

    public static function decrypt(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        if (!self::isEncrypted($value)) {
            // Legacy plaintext row (pre-backfill window): return as-is so
            // reads never fatal; the backfill command closes the window.
            return $value;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException $e) {
            $previous = (string) config('app.previous_key', env('APP_PREVIOUS_KEY', ''));

            if ($previous === '') {
                throw $e;
            }

            return (new Encrypter(self::parseKey($previous), config('app.cipher')))->decryptString($value);
        }
    }

    /**
     * Laravel encryptString payloads are base64(JSON{iv,value,mac,tag}).
     */
    public static function isEncrypted(?string $value): bool
    {
        if (!is_string($value) || $value === '') {
            return false;
        }

        $decoded = base64_decode($value, true);
        if ($decoded === false) {
            return false;
        }

        $payload = json_decode($decoded, true);

        return is_array($payload)
            && isset($payload['iv'], $payload['value'], $payload['mac']);
    }

    private static function parseKey(string $key): string
    {
        if (str_starts_with($key, 'base64:')) {
            $decoded = base64_decode(substr($key, 7), true);
            if ($decoded !== false) {
                return $decoded;
            }
        }

        return $key;
    }
}
