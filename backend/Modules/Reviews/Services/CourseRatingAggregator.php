<?php

namespace Modules\Reviews\Services;

use Core\Services\Contracts\LearnCatalogInterface;
use Modules\Reviews\Entities\Review;

/**
 * Keeps `courses.rating` / `courses.reviews_count` derived from the live
 * (approved) course reviews instead of hand-maintained seed values.
 *
 * Called after every create / update / delete / moderation transition that
 * touches a `course` review, so discovery, the course page, the instructor
 * directory and home rails all read the same aggregate.
 */
class CourseRatingAggregator
{
    public function __construct(
        private LearnCatalogInterface $catalog
    ) {}

    public function sync(string $courseId): void
    {
        $stats = Review::query()
            ->where('reviewable_type', 'course')
            ->where('reviewable_id', $courseId)
            ->whereIn('status', Review::VISIBLE_STATUSES)
            ->selectRaw('count(*) as reviews_total, avg(rating) as rating_average')
            ->first();

        $total = (int) ($stats->reviews_total ?? 0);

        // Learn owns the write (missing/soft-deleted courses are left
        // untouched inside the catalogue service).
        $this->catalog->updateRating(
            $courseId,
            $total > 0 ? round((float) ($stats->rating_average ?? 0), 1) : null,
            $total
        );
    }
}
