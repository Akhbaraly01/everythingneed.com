<?php

namespace App\Services\Engines;

class CommissionEngine
{
    public function __construct(private float $defaultRate = 10.0) {}

    public function commissionFor(float $amount, ?float $overrideRate = null): float
    {
        $rate = $overrideRate ?? $this->defaultRate;
        return round($amount * ($rate / 100), 2);
    }

    public function vendorPayout(float $gross, ?float $rate = null): float
    {
        return round($gross - $this->commissionFor($gross, $rate), 2);
    }

    public function split(array $items, ?float $rate = null): array
    {
        $gross = array_sum(array_column($items, 'total_price'));
        return [
            'gross' => $gross,
            'commission' => $this->commissionFor($gross, $rate),
            'payout' => $this->vendorPayout($gross, $rate),
        ];
    }
}
