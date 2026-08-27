<?php

namespace App\Services\Engines;

class PricingEngine
{
    /**
     * Compute line total with tax and discount.
     * Centralizes all pricing math so modules don't duplicate it.
     */
    public function lineTotal(float $unitPrice, int $qty, float $taxRate = 0, float $discount = 0): float
    {
        $subtotal = $unitPrice * $qty;
        $afterDiscount = max(0, $subtotal - $discount);
        $tax = $afterDiscount * ($taxRate / 100);
        return round($afterDiscount + $tax, 2);
    }

    public function applyCoupon(float $subtotal, array $coupon): float
    {
        if (($coupon['type'] ?? null) === 'percentage') {
            return round($subtotal * ((float) $coupon['value'] / 100), 2);
        }
        return min($subtotal, (float) ($coupon['value'] ?? 0));
    }

    public function orderTotal(array $items, float $taxRate = 0, ?array $coupon = null, float $deliveryFee = 0): float
    {
        $subtotal = array_sum(array_map(fn($i) => $this->lineTotal((float)$i['unit_price'], (int)$i['quantity']), $items));
        $discount = $coupon ? $this->applyCoupon($subtotal, $coupon) : 0;
        $total = max(0, $subtotal - $discount + $deliveryFee);
        $tax = $total * ($taxRate / 100);
        return round($total + $tax, 2);
    }
}
