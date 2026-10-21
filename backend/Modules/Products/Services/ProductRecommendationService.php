<?php

namespace Modules\Products\Services;

use Modules\Products\Entities\Product;

/**
 * Product recommendations ("Related items" / "More to love").
 *
 * The storefront used to list whatever the catalogue returned, which put
 * unrelated rows (and archived/draft products) next to the product the
 * shopper was looking at. This service ranks the live catalogue against
 * the product at hand:
 *
 *   related  - same subcategory / category / vendor, shared attributes,
 *              a comparable price and a good rating.
 *   more     - the rest of the catalogue, ranked by rating, media and
 *              price proximity (discovery across categories).
 *
 * Everything is derived from data the product already carries, so the
 * ranking improves automatically as the catalogue grows - no manual
 * "related products" table to maintain.
 */
class ProductRecommendationService
{
    /** Candidate pool per request (the catalogue is ranked in PHP). */
    private const CANDIDATE_LIMIT = 300;

    /**
     * @return array{related: list<Product>, more: list<Product>}
     */
    public function forProduct(Product $product, int $relatedLimit = 12, int $moreLimit = 12): array
    {
        $candidates = $this->candidates($product);

        $related = [];
        $more = [];

        foreach ($candidates as $candidate) {
            $score = $this->score($product, $candidate);

            if ($score <= 0) {
                continue;
            }

            $entry = ['product' => $candidate, 'score' => $score];

            if ($this->isRelated($product, $candidate)) {
                $related[] = $entry;
            } else {
                $more[] = $entry;
            }
        }

        usort($related, fn (array $a, array $b) => $b['score'] <=> $a['score']);
        usort($more, fn (array $a, array $b) => $b['score'] <=> $a['score']);

        return [
            'related' => array_slice(array_column($related, 'product'), 0, $relatedLimit),
            'more' => array_slice(array_column($more, 'product'), 0, $moreLimit),
        ];
    }

    /**
     * Live products only: hidden, draft and archived rows must never
     * surface in a recommendation.
     *
     * @return list<Product>
     */
    private function candidates(Product $product): array
    {
        return Product::query()
            ->where('is_active', true)
            ->where('id', '!=', $product->id)
            ->where(function ($query) use ($product) {
                // Same category first (the strongest signal), then the
                // rest of the catalogue for discovery.
                $query->where('category', $product->category)
                    ->orWhere('category', '!=', $product->category);
            })
            ->orderByDesc('rating')
            ->limit(self::CANDIDATE_LIMIT)
            ->get()
            ->all();
    }

    /** True when the candidate belongs to the same shelf as the product. */
    private function isRelated(Product $product, Product $candidate): bool
    {
        if ($product->subcategory && $candidate->subcategory === $product->subcategory) {
            return true;
        }

        return $candidate->category === $product->category;
    }

    /** Relevance score; 0 means "not worth showing". */
    private function score(Product $product, Product $candidate): float
    {
        $score = 0.0;

        if ($product->subcategory && $candidate->subcategory === $product->subcategory) {
            $score += 40;
        }

        if ($candidate->category === $product->category) {
            $score += 20;
        }

        if ($candidate->vendor_id === $product->vendor_id) {
            $score += 15;
        }

        $score += min(20, $this->sharedAttributes($product, $candidate) * 5);

        $price = (float) $product->price;
        $other = (float) $candidate->price;

        if ($price > 0 && $other > 0) {
            $distance = abs($price - $other) / max($price, $other);

            if ($distance <= 0.1) {
                $score += 10;
            } elseif ($distance <= 0.3) {
                $score += 6;
            } elseif ($distance <= 0.6) {
                $score += 3;
            }
        }

        $score += min(15, (float) ($candidate->rating ?? 0) * 3);

        if ((int) $candidate->reviews_count > 0) {
            $score += min(10, (int) $candidate->reviews_count);
        }

        if (filled($candidate->image_url) || ! empty($candidate->images)) {
            $score += 5;
        }

        if ((int) $candidate->stock_quantity > 0) {
            $score += 5;
        } else {
            // Out of stock rows are still worth a mention, but never first.
            $score -= 8;
        }

        return $score;
    }

    /** How many attribute values both products share. */
    private function sharedAttributes(Product $product, Product $candidate): int
    {
        $own = $this->attributeValues($product);
        $other = $this->attributeValues($candidate);

        if ($own === [] || $other === []) {
            return 0;
        }

        return count(array_intersect($own, $other));
    }

    /** @return list<string> */
    private function attributeValues(Product $product): array
    {
        $values = [];

        foreach (['attributes', 'specifications'] as $field) {
            $bag = $product->{$field};

            if (is_array($bag)) {
                foreach ($bag as $value) {
                    if (is_scalar($value) && (string) $value !== '') {
                        $values[] = strtolower(trim((string) $value));
                    }
                }
            }
        }

        return array_values(array_unique($values));
    }
}
