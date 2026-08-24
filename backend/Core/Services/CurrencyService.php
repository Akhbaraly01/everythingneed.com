<?php

namespace Core\Services;

use Core\Services\Contracts\CurrencyServiceInterface;

class CurrencyService extends BaseService implements CurrencyServiceInterface
{
    private array $rates = [
        'USD' => 1.0,
        'EUR' => 0.92,
        'GBP' => 0.79,
        'NGN' => 1540.0,
        'KES' => 153.0,
        'ZAR' => 18.5,
        'GHS' => 15.2,
        'CAD' => 1.36,
        'AUD' => 1.53,
        'INR' => 83.0,
    ];

    private array $symbols = [
        'USD' => '$',
        'EUR' => '€',
        'GBP' => '£',
        'NGN' => '₦',
        'KES' => 'KSh',
        'ZAR' => 'R',
        'GHS' => 'GH₵',
        'CAD' => 'CA$',
        'AUD' => 'A$',
        'INR' => '₹',
    ];

    public function convert(float $amount, string $from, string $to): float
    {
        if ($from === $to) {
            return $amount;
        }

        $fromRate = $this->rates[$from] ?? null;
        $toRate = $this->rates[$to] ?? null;

        if ($fromRate === null || $toRate === null) {
            throw new \InvalidArgumentException("Unsupported currency: {$from} or {$to}");
        }

        $usdAmount = $amount / $fromRate;
        $converted = $usdAmount * $toRate;

        return round($converted, 2);
    }

    public function getRate(string $from, string $to): float
    {
        if ($from === $to) {
            return 1.0;
        }

        $fromRate = $this->rates[$from] ?? null;
        $toRate = $this->rates[$to] ?? null;

        if ($fromRate === null || $toRate === null) {
            throw new \InvalidArgumentException("Unsupported currency: {$from} or {$to}");
        }

        return round($toRate / $fromRate, 6);
    }

    public function format(float $amount, string $currency): string
    {
        $symbol = $this->symbols[$currency] ?? $currency . ' ';
        $formatted = number_format($amount, 2);

        return $symbol . $formatted;
    }
}
