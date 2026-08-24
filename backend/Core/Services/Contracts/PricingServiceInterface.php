<?php

namespace Core\Services\Contracts;

interface PricingServiceInterface
{
    public function calculateLineTotal(float $unitPrice, int $quantity, float $discount = 0): float;
    public function calculateSubtotal(array $lines): float;
    public function applyTax(float $amount, float $rate): array;
    public function extractInclusiveTax(float $grossAmount, float $rate): array;
}
