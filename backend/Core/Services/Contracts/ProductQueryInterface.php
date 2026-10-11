<?php

namespace Core\Services\Contracts;

/**
 * Catalogue moderation across module boundaries.
 * Implemented by\Modules\Products.
 */
interface ProductQueryInterface
{
    /**
     * Products awaiting approval.
     *
     * $categoryScope null = full queue; string = only that products.category
     * (fail-closed sentinel never matches a real category).
     *
     * @return array{data: array, meta: array{current_page: int, last_page: int, per_page: int, total: int}}
     */
    public function pending(int $perPage = 20, ?string $categoryScope = null): array;

    /**
     * Approve (publish) or reject a product.
     *
     * A non-null $categoryScope refuses any product outside that scope
     * (returns null, indistinguishable from missing — no existence leak).
     *
     * @return object|null fresh product, or null when missing/out of scope
     */
    public function decide(string $id, bool $approve, ?string $reason = null, ?string $categoryScope = null): ?object;
}
