<?php

namespace Modules\Reviews\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Reviews\Entities\Review;
use Modules\Reviews\Services\CourseRatingAggregator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(private CourseRatingAggregator $courseRatings) {}

    public function index(Request $request): JsonResponse
    {
        $query = Review::with(['user']);

        if ($request->boolean('mine') && $request->user()) {
            // Owners always see their own rows, whatever the moderation state.
            $query->where('user_id', $request->user()->id);
        } else {
            // Public read: only approved reviews are ever published.
            $query->visible();
        }

        if ($request->has('reviewable_type')) {
            $query->where('reviewable_type', $request->reviewable_type);
        }

        if ($request->has('reviewable_id')) {
            $query->where('reviewable_id', $request->reviewable_id);
        }

        $reviews = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
                'reviewable_type' => 'required|string|in:product,vendor,doctor,hotel,worker,restaurant,course,property,need_request',
            'reviewable_id' => 'required|uuid',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        // Need requests (spec S14): only the requester may review, only
        // once, and only after the request completed.
        $verifiedPurchase = false;
        if ($validated['reviewable_type'] === 'need_request') {
            $need = \Modules\Needs\Entities\NeedRequest::find($validated['reviewable_id']);
            if (!$need) {
                return response()->json(['message' => 'Request not found'], 404);
            }
            if ((string) $need->user_id !== (string) $request->user()->id) {
                return response()->json(['message' => 'Only the requester can review this request'], 403);
            }
            if ($need->status !== \Modules\Needs\Entities\NeedRequest::STATUS_COMPLETED) {
                return response()->json(['message' => 'You can review once the request is completed'], 422);
            }
            $already = Review::where('user_id', $request->user()->id)
                ->where('reviewable_type', 'need_request')
                ->where('reviewable_id', $need->id)
                ->exists();
            if ($already) {
                return response()->json(['message' => 'You already reviewed this request'], 422);
            }
            // A completed request is a verified transaction by construction.
            $verifiedPurchase = true;
        }

        // Courses (L-B.5): only an enrolled learner may review, only once,
        // and the course has to exist. Enrollment is the transaction that
        // makes the review trustworthy - it also earns the verified badge.
        if ($validated['reviewable_type'] === 'course') {
            $course = \Modules\Learn\Entities\Course::find($validated['reviewable_id']);
            if (!$course) {
                return response()->json(['message' => 'Course not found'], 404);
            }
            $enrolled = \Modules\Learn\Entities\Enrollment::where('user_id', $request->user()->id)
                ->where('course_id', $course->id)
                ->exists();
            if (!$enrolled) {
                return response()->json(['message' => 'Only enrolled learners can review this course'], 403);
            }
            $already = Review::where('user_id', $request->user()->id)
                ->where('reviewable_type', 'course')
                ->where('reviewable_id', $course->id)
                ->exists();
            if ($already) {
                return response()->json(['message' => 'You already reviewed this course'], 422);
            }
            $verifiedPurchase = true;
        }

        // Products (master-plan phase 22): the verified-purchase badge is
        // computed server-side from delivered/completed orders - never
        // trusted from the request payload.
        if ($validated['reviewable_type'] === 'product') {
            $verifiedPurchase = \Modules\Orders\Entities\Order::where('user_id', $request->user()->id)
                ->whereIn('status', [
                    \Modules\Orders\Entities\Order::STATUS_DELIVERED,
                    \Modules\Orders\Entities\Order::STATUS_COMPLETED,
                ])
                ->whereHas('items', fn ($q) => $q->where('product_id', $validated['reviewable_id']))
                ->exists();
        }

        $review = null;
        try {
            $review = Review::create(array_merge($validated, [
                'user_id' => $request->user()->id,
                'is_verified_purchase' => $verifiedPurchase,
                'status' => Review::STATUS_APPROVED,
            ]));
        } catch (\Illuminate\Database\QueryException $e) {
            // Concurrent double-submit: the unique indexes collapse the race
            // - report the duplicate honestly for the type being reviewed.
            if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                $message = $validated['reviewable_type'] === 'course'
                    ? 'You already reviewed this course'
                    : 'You already reviewed this request';

                return response()->json(['message' => $message], 422);
            }

            throw $e;
        }

        if ($review->reviewable_type === 'course') {
            $this->courseRatings->sync($review->reviewable_id);
        }

        return response()->json([
            'message' => 'Review submitted successfully',
            'data' => $review,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $review = Review::find($id);

        if (!$review || $review->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        // Moderation state is deliberately NOT reset by an owner edit: a
        // hidden review stays hidden until a moderator approves it again.
        $review->update($request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]));

        if ($review->reviewable_type === 'course') {
            $this->courseRatings->sync($review->reviewable_id);
        }

        return response()->json([
            'message' => 'Review updated successfully',
            'data' => $review->fresh(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $review = Review::find($id);
        if (!$review || $review->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Review not found'], 404);
        }
        $courseId = $review->reviewable_type === 'course' ? $review->reviewable_id : null;
        $review->delete();

        if ($courseId !== null) {
            $this->courseRatings->sync($courseId);
        }

        return response()->json(['message' => 'Review deleted']);
    }

    /**
     * The current user's reviews.
     */
    public function mine(Request $request): JsonResponse
    {
        $reviews = Review::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $reviews]);
    }

    /**
     * Mark a review helpful or not (spec 52 abuse-resistant feedback: one
     * vote per user, counted server-side).
     */
    public function vote(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'is_helpful' => 'required|boolean',
        ]);

        $review = Review::find($id);
        if (!$review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        \Modules\Reviews\Entities\ReviewVote::updateOrCreate(
            ['review_id' => $review->id, 'user_id' => $request->user()->id],
            ['is_helpful' => $validated['is_helpful']]
        );

        $review->update([
            'helpful_count' => \Modules\Reviews\Entities\ReviewVote::where('review_id', $review->id)
                ->where('is_helpful', true)
                ->count(),
        ]);

        return response()->json([
            'message' => 'Vote recorded',
            'data' => $review->fresh(),
        ]);
    }
}
