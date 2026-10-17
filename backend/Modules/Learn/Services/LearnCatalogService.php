<?php

namespace Modules\Learn\Services;

use Core\Services\Contracts\LearnCatalogInterface;
use Modules\Learn\Entities\Course;

/**
 * Learn-owned catalogue writes. Cross-module callers (e.g. the Reviews
 * rating aggregator) go through LearnCatalogInterface — never the entity.
 */
class LearnCatalogService implements LearnCatalogInterface
{
    public function updateRating(string $courseId, ?float $rating, int $reviewsCount): void
    {
        // A soft-deleted course is out of discovery; leave it untouched.
        $course = Course::find($courseId);
        if (!$course) {
            return;
        }

        $course->rating = $rating;
        $course->reviews_count = $reviewsCount;
        $course->save();
    }
}
