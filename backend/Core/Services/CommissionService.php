<?php

namespace Core\Services;

use Core\Services\Contracts\CommissionServiceInterface;

class CommissionService extends BaseService implements CommissionServiceInterface
{
    private float $defaultRate = 10.0;

    public function calculateVendorPayout(float $gross, float $commissionRate): array
    {
        $rate = $commissionRate ?? $this->defaultRate;
        $commissionAmount = round($gross * ($rate / 100), 2);
        $vendorPayout = round($gross - $commissionAmount, 2);

        return [
            'gross_amount' => $gross,
            'commission_rate' => $rate,
            'commission_amount' => $commissionAmount,
            'vendor_payout' => $vendorPayout,
        ];
    }
}
