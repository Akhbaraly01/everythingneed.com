<?php

namespace Core\Services;

use Core\Services\Contracts\PricingServiceInterface;

class PricingService extends BaseService implements PricingServiceInterface
{
    public function calculateLineTotal(float $unitPrice, int $quantity, float $discount = 0): float
    {
        $subtotal = round($unitPrice * $quantity, 2);

        return round($subtotal - $discount, 2);
    }

    public function calculateSubtotal(array $lines): float
    {
        $subtotal = 0.0;

        foreach ($lines as $line) {
            $unitPrice = $line['unit_price'] ?? 0;
            $quantity = $line['quantity'] ?? 1;
            $discount = $line['discount'] ?? 0;

            $subtotal += $this->calculateLineTotal($unitPrice, $quantity, $discount);
        }

        return round($subtotal, 2);
    }

    public function applyTax(float $amount, float $rate): array
    {
        $taxAmount = round($amount * ($rate / 100), 2);
        $total = round($amount + $taxAmount, 2);

        return [
            'subtotal' => $amount,
            'tax_rate' => $rate,
            'tax_amount' => $taxAmount,
            'total' => $total,
        ];
    }

    public function extractInclusiveTax(float $grossAmount, float $rate): array
    {
        $netAmount = round($grossAmount / (1 + $rate / 100), 2);
        $taxAmount = round($grossAmount - $netAmount, 2);

        return [
            'gross_amount' => $grossAmount,
            'net_amount' => $netAmount,
            'tax_rate' => $rate,
            'tax_amount' => $taxAmount,
        ];
    }
}
