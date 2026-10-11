<?php

namespace Modules\Reviews\Services;

use Modules\Learn\Entities\Course;
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
    public function sync(string $courseId): void
    {
        $stats = Review::query()
            ->where('reviewable_type', 'course')
            ->where('reviewable_id', $courseId)
            ->whereIn('status', Review::VISIBLE_STATUSES)
            ->selectRaw('count(*) as reviews_total, avg(rating) as rating_average')
            ->first();

        // A soft-deleted course is out of discovery; leave it untouched.
        $course = Course::find($courseId);
        if (!$course) {
            return;
        }

        $total = (int) ($stats->reviews_total ?? 0);
        $course->rating = $total > 0 ? round((float) ($stats->rating_average ?? 0), 1) : null;
        $course->reviews_count = $total;
        $course->save();
    }
}
