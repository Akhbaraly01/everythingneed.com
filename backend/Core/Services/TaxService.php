<?php

namespace Core\Services;

use Core\Services\Contracts\TaxServiceInterface;

class TaxService extends BaseService implements TaxServiceInterface
{
    private array $jurisdictionRates = [
        'default' => 10.0,
        'US-CA' => 7.25,
        'US-NY' => 8.0,
        'US-TX' => 6.25,
        'UK' => 20.0,
        'EU-DE' => 19.0,
        'EU-FR' => 20.0,
        'NG' => 7.5,
        'KE' => 16.0,
        'ZA' => 15.0,
    ];

    public function calculate(float $amount, string $jurisdiction = 'default'): array
    {
        $rate = $this->getRate($jurisdiction);
        $taxAmount = round($amount * ($rate / 100), 2);
        $total = round($amount + $taxAmount, 2);

        return [
            'amount' => $amount,
            'jurisdiction' => $jurisdiction,
            'tax_rate' => $rate,
            'tax_amount' => $taxAmount,
            'total' => $total,
        ];
    }

    public function getRate(string $jurisdiction = 'default'): float
    {
        return $this->jurisdictionRates[$jurisdiction]
            ?? $this->jurisdictionRates['default'];
    }
}
