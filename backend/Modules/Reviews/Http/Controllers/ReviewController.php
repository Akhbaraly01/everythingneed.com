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
                'reviewable_type' => 'required|string|in:product,vendor,doctor,hotel,worker,restaurant,course,property,need_request,task_post',
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

        // Task posts (TODO 17): only the task owner may review, only once,
        // and only after the task completed.
        if ($validated['reviewable_type'] === 'task_post') {
            $task = \Modules\Needs\Entities\TaskPost::find($validated['reviewable_id']);
            if (!$task) {
                return response()->json(['message' => 'Task not found'], 404);
            }
            if ((string) $task->created_by !== (string) $request->user()->id) {
                return response()->json(['message' => 'Only the task owner can review this task'], 403);
            }
            if ($task->status !== \Modules\Needs\Entities\TaskPost::STATUS_COMPLETED) {
                return response()->json(['message' => 'You can review once the task is completed'], 422);
            }
            $already = Review::where('user_id', $request->user()->id)
                ->where('reviewable_type', 'task_post')
                ->where('reviewable_id', $task->id)
                ->exists();
            if ($already) {
                return response()->json(['message' => 'You already reviewed this task'], 422);
            }
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

        // Hotels (N-40): the hotel must exist and each guest reviews once.
        // The verified-guest badge is computed server-side from a completed
        // stay — guests without an on-platform booking may still review
        // (they simply carry no badge), never the other way around.
        if ($validated['reviewable_type'] === 'hotel') {
            $hotel = \Modules\Hotels\Entities\Hotel::find($validated['reviewable_id']);
            if (!$hotel) {
                return response()->json(['message' => 'Hotel not found'], 404);
            }
            $already = Review::where('user_id', $request->user()->id)
                ->where('reviewable_type', 'hotel')
                ->where('reviewable_id', $hotel->id)
                ->exists();
            if ($already) {
                return response()->json(['message' => 'You already reviewed this hotel'], 422);
            }
            $verifiedPurchase = \Modules\Hotels\Entities\HotelReservation::where('user_id', $request->user()->id)
                ->where('hotel_id', $hotel->id)
                ->whereIn('status', [
                    \Modules\Hotels\Entities\HotelReservation::STATUS_CHECKED_OUT,
                    \Modules\Hotels\Entities\HotelReservation::STATUS_COMPLETED,
                ])
                ->exists();
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
            // Savepoint: a 23505 race-collapse must not poison an outer
            // transaction (pgsql 25P02) — same pattern as the webhook intake.
            $review = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $request, $verifiedPurchase) {
                return Review::create(array_merge($validated, [
                    'user_id' => $request->user()->id,
                    'is_verified_purchase' => $verifiedPurchase,
                    'status' => Review::STATUS_APPROVED,
                ]));
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // Concurrent double-submit: the unique indexes collapse the race
            // - report the duplicate honestly for the type being reviewed.
            if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                $message = match ($validated['reviewable_type']) {
                    'course' => 'You already reviewed this course',
                    'task_post' => 'You already reviewed this task',
                    'hotel' => 'You already reviewed this hotel',
                    default => 'You already reviewed this request',
                };

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

    /**
     * TODO 17 reporting: any signed-in user may flag a review once.
     * Reports queue for moderators; the review itself is untouched until a
     * moderator decides (no public shaming by report volume).
     */
    public function report(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $review = Review::find($id);
        if (! $review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        if ((string) $review->user_id === (string) $request->user()->id) {
            return response()->json(['message' => 'You cannot report your own review'], 422);
        }

        try {
            // Savepoint: a duplicate report must not poison an outer
            // transaction (pgsql 25P02).
            $report = \Illuminate\Support\Facades\DB::transaction(function () use ($review, $request, $validated) {
                return \Modules\Reviews\Entities\ReviewReport::create([
                    'review_id' => $review->id,
                    'reporter_id' => $request->user()->id,
                    'reason' => $validated['reason'],
                    'status' => 'open',
                ]);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                return response()->json(['message' => 'You already reported this review'], 422);
            }

            throw $e;
        }

        return response()->json(['message' => 'Report submitted', 'data' => $report], 201);
    }

    /**
     * TODO 17 provider response: the reviewed counterparty answers once,
     * visibly attached to the review. Needs tasks/requests resolve the
     * counterparty from the engagement; other types stay closed.
     */
    public function respond(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'response' => ['required', 'string', 'max:2000'],
        ]);

        $review = Review::find($id);
        if (! $review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        if ($review->provider_response !== null) {
            return response()->json(['message' => 'This review already has a response'], 422);
        }

        if (! $this->isReviewCounterparty($request, $review)) {
            return response()->json(['message' => 'Only the reviewed provider can respond'], 403);
        }

        $review->update([
            'provider_response' => $validated['response'],
            'responded_at' => now(),
        ]);

        return response()->json(['message' => 'Response posted', 'data' => $review->fresh()]);
    }

    private function isReviewCounterparty(Request $request, Review $review): bool
    {
        $userId = (string) $request->user()->id;

        if ($review->reviewable_type === 'need_request') {
            $need = \Modules\Needs\Entities\NeedRequest::find($review->reviewable_id);

            return $need && $need->acceptedOffer
                && (string) $need->acceptedOffer->provider_id === $userId;
        }

        if ($review->reviewable_type === 'task_post') {
            $task = \Modules\Needs\Entities\TaskPost::with('assignedApplication')->find($review->reviewable_id);

            return $task && $task->assignedApplication
                && (string) $task->assignedApplication->user_id === $userId;
        }

        return false;
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
