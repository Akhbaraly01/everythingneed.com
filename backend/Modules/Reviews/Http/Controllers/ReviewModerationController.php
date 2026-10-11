<?php

namespace Modules\Reviews\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Reviews\Entities\Review;
use Modules\Reviews\Services\CourseRatingAggregator;

/**
 * Review moderation (L-B.5): one list endpoint that sees every status, and
 * one idempotent transition endpoint (approved / hidden / rejected) behind
 * `role:` + `permission:reviews.reviews.moderate`. Every transition writes an
 * audit row; hiding a course review recomputes its aggregate immediately.
 */
class ReviewModerationController extends Controller
{
    public function __construct(
        private AuditServiceInterface $audit,
        private CourseRatingAggregator $courseRatings,
    ) {}

    /** Every status, newest first - the console needs hidden rows too. */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:approved,pending,hidden,rejected',
            'reviewable_type' => 'nullable|string|max:40',
            'reviewable_id' => 'nullable|uuid',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = Review::with(['user']);

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        if (!empty($validated['reviewable_type'])) {
            $query->where('reviewable_type', $validated['reviewable_type']);
        }
        if (!empty($validated['reviewable_id'])) {
            $query->where('reviewable_id', $validated['reviewable_id']);
        }

        $reviews = $query->orderByDesc('created_at')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    /** Idempotent transition: posting the current status is a no-op. */
    public function status(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:approved,hidden,rejected',
            'reason' => 'nullable|string|max:500',
        ]);

        $review = Review::find($id);
        if (!$review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        if ($review->status === $validated['status']) {
            return response()->json([
                'message' => 'Review already '.$validated['status'],
                'data' => $review,
            ]);
        }

        $oldStatus = $review->status;
        $review->update([
            'status' => $validated['status'],
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'moderation_reason' => $validated['reason'] ?? null,
        ]);

        try {
            $this->audit->log([
                'action' => 'review.moderated',
                'entity_type' => 'reviews',
                'entity_id' => $review->id,
                'performed_by' => $request->user()->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => $validated['status'], 'reason' => $validated['reason'] ?? null],
            ]);
        } catch (\Throwable) {
            // audit failure never blocks a moderator closing a case
        }

        if ($review->reviewable_type === 'course') {
            $this->courseRatings->sync($review->reviewable_id);
        }

        return response()->json([
            'message' => 'Review '.$validated['status'],
            'data' => $review->fresh(),
        ]);
    }
}
