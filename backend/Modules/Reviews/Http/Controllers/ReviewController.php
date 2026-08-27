<?php

namespace Modules\Reviews\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Reviews\Entities\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Review::with(['user']);

        if ($request->boolean('mine') && $request->user()) {
            $query->where('user_id', $request->user()->id);
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
            'reviewable_type' => 'required|string|in:product,vendor,doctor,hotel,restaurant,course,property',
            'reviewable_id' => 'required|uuid',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $review = Review::create(array_merge($validated, [
            'user_id' => $request->user()->id,
        ]));

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

        $review->update($request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]));

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
        $review->delete();
        return response()->json(['message' => 'Review deleted']);
    }
}
