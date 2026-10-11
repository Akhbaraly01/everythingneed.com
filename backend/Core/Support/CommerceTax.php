<?php

namespace Core\Support;

use Core\Services\TaxService;

/**
 * Server-authoritative marketplace tax (spec §33: never trust tax from the
 * browser). Rate comes from `config/commerce.php` - a plain percentage by
 * default (0 = no tax configured), or a TaxService jurisdiction rate when
 * `COMMERCE_TAX_JURISDICTION` is set.
 */
final class CommerceTax
{
    public static function rate(): float
    {
        $jurisdiction = (string) config('commerce.tax.jurisdiction', '');

        if ($jurisdiction !== '') {
            return app(TaxService::class)->getRate($jurisdiction);
        }

        return (float) config('commerce.tax.rate', 0);
    }

    public static function amount(float $taxable): float
    {
        return round($taxable * (self::rate() / 100), 2);
    }

    public static function rateLabel(): string
    {
        return rtrim(rtrim(number_format(self::rate(), 2, '.', ''), '0'), '.') . '%';
    }
}
