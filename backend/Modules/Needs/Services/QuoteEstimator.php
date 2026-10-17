<?php

namespace Modules\Needs\Services;

use Modules\Needs\Entities\NeedCostGuide;

/**
 * N-35 upfront quote calculator: returns the category's published cost
 * guide range scaled by quantity (units of the guide's pricing_unit).
 * The guide IS the estimator data source — one dataset serves discovery
 * content and live estimates.
 */
class QuoteEstimator
{
    /**
     * @return array{estimate: array{price_min: float, price_avg: float, price_max: float, currency: string, quantity: int, pricing_unit: string}, guide: array{id: string, slug: string, title: string}}|null
     */
    public static function estimate(string $categoryId, int $quantity = 1): ?array
    {
        $quantity = max(1, $quantity);

        $guide = NeedCostGuide::published()
            ->where('need_category_id', $categoryId)
            ->orderByDesc('updated_at')
            ->first();

        if (! $guide || ($guide->price_min === null && $guide->price_max === null && $guide->price_avg === null)) {
            return null;
        }

        $scale = fn (?string $value): ?float => $value === null
            ? null
            : round((float) $value * $quantity, 2);

        return [
            'estimate' => [
                'price_min' => $scale($guide->price_min) ?? 0.0,
                'price_avg' => $scale($guide->price_avg) ?? 0.0,
                'price_max' => $scale($guide->price_max) ?? 0.0,
                'currency' => $guide->currency,
                'quantity' => $quantity,
                'pricing_unit' => $guide->pricing_unit,
            ],
            'guide' => [
                'id' => $guide->id,
                'slug' => $guide->slug,
                'title' => $guide->title,
            ],
        ];
    }
}
