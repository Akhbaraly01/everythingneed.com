<?php

namespace Modules\Engagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EngagementController extends Controller
{
    public function wishlist(Request $request): JsonResponse
    {
        $items = DB::table('wishlists')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $items]);
    }

    /**
     * Product comparison set (server-backed, capped).
     */
    public function compare(Request $request): JsonResponse
    {
        $items = \Modules\Engagement\Entities\ProductComparison::with('product:id,name,price,image_url,rating,vendor_id')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function addToCompare(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'uuid', 'exists:products,id'],
        ]);

        $userId = $request->user()->id;

        // Already present → idempotent success
        if (\Modules\Engagement\Entities\ProductComparison::where('user_id', $userId)
            ->where('product_id', $validated['product_id'])->exists()) {
            return response()->json(['message' => 'Already in comparison']);
        }

        $count = \Modules\Engagement\Entities\ProductComparison::where('user_id', $userId)->count();
        if ($count >= \Modules\Engagement\Entities\ProductComparison::MAX_ITEMS) {
            return response()->json([
                'message' => 'Comparison is full',
                'error' => 'Remove an item before adding another (max '.\Modules\Engagement\Entities\ProductComparison::MAX_ITEMS.').',
            ], 422);
        }

        \Modules\Engagement\Entities\ProductComparison::create([
            'user_id' => $userId,
            'product_id' => $validated['product_id'],
        ]);

        return response()->json(['message' => 'Added to comparison'], 201);
    }

    public function removeFromCompare(Request $request, string $productId): JsonResponse
    {
        $deleted = \Modules\Engagement\Entities\ProductComparison::where('user_id', $request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Not in comparison'], 404);
        }

        return response()->json(['message' => 'Removed from comparison']);
    }

    public function addToWishlist(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|string',
            'entity_type' => 'nullable|string|max:50',
        ]);

        $exists = DB::table('wishlists')
            ->where('user_id', $request->user()->id)
            ->where('product_id', $request->product_id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Already in wishlist'], 409);
        }

        DB::table('wishlists')->insert([
            'user_id' => $request->user()->id,
            'product_id' => $request->product_id,
            'entity_type' => $request->entity_type ?? 'product',
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Added to wishlist'], 201);
    }

    public function removeFromWishlist(Request $request, string $id): JsonResponse
    {
        DB::table('wishlists')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['message' => 'Removed from wishlist']);
    }

    public function recentlyViewed(Request $request): JsonResponse
    {
        $items = DB::table('recently_viewed')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json(['data' => $items]);
    }

    public function toggleFavorite(Request $request): JsonResponse
    {
        $request->validate([
            'entity_type' => 'required|string|max:50',
            'entity_id' => 'required|string',
        ]);

        $exists = DB::table('favorites')
            ->where('user_id', $request->user()->id)
            ->where('entity_type', $request->entity_type)
            ->where('entity_id', $request->entity_id)
            ->first();

        if ($exists) {
            DB::table('favorites')->where('id', $exists->id)->delete();
            return response()->json(['message' => 'Removed from favorites', 'favorited' => false]);
        }

        DB::table('favorites')->insert([
            'user_id' => $request->user()->id,
            'entity_type' => $request->entity_type,
            'entity_id' => $request->entity_id,
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Added to favorites', 'favorited' => true], 201);
    }
}
