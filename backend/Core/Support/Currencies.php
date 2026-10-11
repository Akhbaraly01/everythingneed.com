<?php

namespace Core\Support;

/**
 * W18 (F-03): single source of truth for supported ISO-4217 currency codes.
 *
 * Server-side enforcement point for the money inputs that previously
 * accepted any 3-letter code (bill purchase, need requests). The union
 * covers both frontend lists (`bills/Index.tsx`, `needs/Request.tsx`)
 * so no existing option is rejected.
 */
final class Currencies
{
    /** @var string[] */
    public const SUPPORTED = [
        'USD', 'EUR', 'GBP', 'GHS', 'KES', 'NGN', 'ZAR', 'INR', 'AED',
    ];

    public const DEFAULT = 'USD';

    /**
     * Platform default currency (spec 90): one env-driven knob
     * (APP_CURRENCY) so business logic never hard-codes a currency.
     */
    public static function default(): string
    {
        return self::normalize(config('app.currency', self::DEFAULT)) ?? self::DEFAULT;
    }

    public static function normalize(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $code = strtoupper(trim($value));

        return $code === '' ? null : $code;
    }

    public static function isSupported(?string $code): bool
    {
        return $code !== null && in_array($code, self::SUPPORTED, true);
    }
}
