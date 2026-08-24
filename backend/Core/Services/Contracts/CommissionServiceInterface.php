<?php

namespace Core\Services\Contracts;

interface CommissionServiceInterface
{
    public function calculateVendorPayout(float $gross, float $commissionRate): array;
}
