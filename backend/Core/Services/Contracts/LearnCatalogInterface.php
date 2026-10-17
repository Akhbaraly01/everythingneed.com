<?php

namespace Core\Services\Contracts;

/**
 * Learn catalogue writes consumed across module boundaries (course rating
 * aggregation). Implemented by Modules\Learn — callers never touch the
 * Course entity directly (domain isolation).
 */
interface LearnCatalogInterface
{
    /**
     * Persist a precomputed rating aggregate. No-op when the course is
     * missing or soft-deleted (out of discovery — left untouched).
     */
    public function updateRating(string $courseId, ?float $rating, int $reviewsCount): void;
}
