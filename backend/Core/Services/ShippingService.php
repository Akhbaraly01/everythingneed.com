<?php

namespace Core\Services;

use Modules\Checkout\Entities\ShippingRate;

class ShippingService
{
    /**
     * Shipping fee for a (discounted) subtotal.
     *
     * - No active rates configured -> 0.00 (graceful; keeps legacy totals intact).
     * - Rates with a free_shipping_min_subtotal <= subtotal ship free.
     * - Otherwise the cheapest active rate wins.
     */
    public function calculate(float $subtotal): float
    {
        $rates = ShippingRate::query()
            ->where('is_active', true)
            ->orderBy('rate')
            ->get();

        if ($rates->isEmpty()) {
            return 0.0;
        }

        foreach ($rates as $rate) {
            if ($rate->free_shipping_min_subtotal !== null
                && $subtotal >= (float) $rate->free_shipping_min_subtotal) {
                return 0.0;
            }
        }

        return (float) $rates->first()->rate;
    }

    /**
     * Spec §61 estimated delivery: shortest advertised window (days) across
     * active rates, or null when no provider publishes one (honest empty,
     * never a made-up ETA).
     */
    public function estimatedDays(): ?int
    {
        $days = \Modules\Checkout\Entities\ShippingRate::query()
            ->where('is_active', true)
            ->whereNotNull('estimated_days')
            ->min('estimated_days');

        return $days === null ? null : (int) $days;
    }
}
