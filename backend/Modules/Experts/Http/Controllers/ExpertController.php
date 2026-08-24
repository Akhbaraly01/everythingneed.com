<?php

namespace Modules\Experts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('doctors');

        if ($request->has('specialty')) {
            $query->where('specialization', $request->specialty);
        }

        if ($request->boolean('available')) {
            $query->where('is_available', true);
        }

        $experts = $query->orderByDesc('rating')->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $experts->items(),
            'meta' => [
                'current_page' => $experts->currentPage(),
                'last_page' => $experts->lastPage(),
                'per_page' => $experts->perPage(),
                'total' => $experts->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $expert = DB::table('doctors')
            ->where('id', $id)
            ->first();

        if (!$expert) {
            return response()->json(['message' => 'Expert not found'], 404);
        }

        $reviews = DB::table('expert_reviews')
            ->where('expert_id', $id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return response()->json(['data' => ['expert' => $expert, 'reviews' => $reviews]]);
    }

    public function storeReview(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $reviewId = DB::table('expert_reviews')->insertGetId([
            'expert_id' => $id,
            'user_id' => $request->user()->id,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Review submitted', 'id' => $reviewId], 201);
    }

    public function availability(Request $request, string $id): JsonResponse
    {
        $slots = DB::table('expert_availability')
            ->where('expert_id', $id)
            ->where('is_available', true)
            ->first();

        return response()->json(['data' => $slots]);
    }
}
