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

        // Resolve display snapshots in batched queries per entity type
        // (products + jobs + properties). Unknown or deleted entities
        // resolve to null and render as "No longer available" instead of
        // broken cards.
        $productIds = $items->whereIn('entity_type', ['product', null])->pluck('product_id')->all();
        $jobIds = $items->where('entity_type', 'job')->pluck('product_id')->all();
        $propertyIds = $items->where('entity_type', 'property')->pluck('product_id')->all();

        $products = \Modules\Products\Entities\Product::with('vendor:id,store_name')
            ->whereIn('id', $productIds ?: ['00000000-0000-0000-0000-000000000000'])
            ->get()
            ->keyBy('id');
        $jobs = \Modules\Jobs\Entities\JobPost::whereIn('id', $jobIds ?: ['00000000-0000-0000-0000-000000000000'])
            ->get()
            ->keyBy('id');
        $properties = \Modules\RealEstate\Entities\Property::whereIn('id', $propertyIds ?: ['00000000-0000-0000-0000-000000000000'])
            ->get()
            ->keyBy('id');

        $data = $items->map(function ($row) use ($products, $jobs, $properties) {
            $type = $row->entity_type ?? 'product';
            $snapshot = null;
            if ($type === 'job' && isset($jobs[$row->product_id])) {
                $job = $jobs[$row->product_id];
                $snapshot = [
                    'title' => $job->title,
                    'subtitle' => trim(($job->company ?? '') . ($job->location ? ' · ' . $job->location : '')),
                    'image_url' => null,
                    'price' => null,
                    'link' => "/jobs/{$job->id}",
                ];
            } elseif ($type === 'property' && isset($properties[$row->product_id])) {
                $home = $properties[$row->product_id];
                $place = trim(($home->city ?? '') . (($home->country ?? '') ? ', ' . $home->country : ''));
                $snapshot = [
                    'title' => $home->title,
                    'subtitle' => $place !== '' ? $place : null,
                    'image_url' => is_array($home->images) ? ($home->images[0] ?? null) : null,
                    'price' => $home->price !== null ? (float) $home->price : null,
                    'link' => "/properties/{$home->id}",
                ];
            } elseif (isset($products[$row->product_id])) {
                $product = $products[$row->product_id];
                $snapshot = [
                    'title' => $product->name,
                    'subtitle' => $product->vendor->store_name ?? null,
                    'image_url' => $product->image_url,
                    'price' => $product->price !== null ? (float) $product->price : null,
                    'link' => "/products/{$product->id}",
                ];
            }

            return [
                'id' => $row->id,
                'entity_type' => $type,
                'entity_id' => $row->product_id,
                'product_id' => $row->product_id,
                'snapshot' => $snapshot,
                'created_at' => $row->created_at,
            ];
        })->values();

        return response()->json(['data' => $data]);
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
        $validated = $request->validate([
            'product_id' => 'required|string',
            'entity_type' => 'nullable|string|in:product,job,property',
        ]);
        $type = $validated['entity_type'] ?? 'product';

        // Typed entities resolve against their own table (a job id must be
        // a real job — never trust a raw client id blindly).
        if ($type === 'job' && !\Modules\Jobs\Entities\JobPost::where('id', $validated['product_id'])->exists()) {
            return response()->json(['message' => 'Job not found'], 404);
        }
        if ($type === 'property' && !\Modules\RealEstate\Entities\Property::where('id', $validated['product_id'])->exists()) {
            return response()->json(['message' => 'Property not found'], 404);
        }
        if ($type === 'product' && !\Modules\Products\Entities\Product::where('id', $validated['product_id'])->exists()) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $exists = DB::table('wishlists')
            ->where('user_id', $request->user()->id)
            ->where('entity_type', $type)
            ->where('product_id', $request->product_id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Already in wishlist'], 409);
        }

        try {
            DB::table('wishlists')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => $request->user()->id,
                'product_id' => $request->product_id,
                'entity_type' => $type,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // Unique (user, type, entity) — a concurrent submit won.
            if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                return response()->json(['message' => 'Already in wishlist'], 409);
            }
            throw $e;
        }

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
        // recently_viewed carries viewed_at (written by TableGateway), not
        // created_at - ordering by created_at 500d on the missing column.
        $items = DB::table('recently_viewed')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('viewed_at')
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
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $request->user()->id,
            'entity_type' => $request->entity_type,
            'entity_id' => $request->entity_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Added to favorites', 'favorited' => true], 201);
    }
}
