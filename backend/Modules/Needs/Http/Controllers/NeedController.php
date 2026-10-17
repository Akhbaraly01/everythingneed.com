<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NeedController extends Controller
{
    public function categories(): JsonResponse
    {
        $categories = \Modules\Needs\Entities\NeedCategory::with(['children' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    /**
     * TODO 05: single category with its question schema (drives the
     * category-aware request form). Inactive categories stay hidden.
     */
    public function category(string $id): JsonResponse
    {
        $category = \Modules\Needs\Entities\NeedCategory::with(['children' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
            ->where('is_active', true)
            ->find($id);

        if (! $category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json(['data' => $category]);
    }

    public function items(Request $request): JsonResponse
    {
        // TODO 09: only eligible approved listings are publicly discoverable.
        $query = DB::table('need_items')
            ->join('need_categories', 'need_items.category_id', '=', 'need_categories.id')
            ->where('need_items.status', \Modules\Needs\Entities\NeedItem::STATUS_PUBLISHED)
            ->where('need_items.is_available', true)
            ->where('need_categories.is_active', true)
            ->select('need_items.*')
            ->orderByDesc('need_items.created_at');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Spec S10: browse a category by slug (need_categories.slug).
        if ($request->filled('category')) {
            $category = \Modules\Needs\Entities\NeedCategory::where('slug', $request->category)->first();
            $query->where('category_id', $category?->id);
        }

        if ($request->has('vendor_id')) {
            $query->where('need_items.vendor_id', $request->vendor_id);
        }

        $items = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    /**
     * TODO 09: vendor/provider listings enter as draft (or submitted with
     * submit=true) — never directly published. Publication is the reviewer's
     * decision, so only eligible approved listings become discoverable.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'category_id' => 'required|uuid|exists:need_categories,id',
            'price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|string|max:500',
            'packages' => 'nullable|array|max:5',
            'packages.*.name' => 'required_with:packages|string|max:120',
            'packages.*.price' => 'required_with:packages|numeric|min:0',
            'packages.*.description' => 'nullable|string|max:500',
            'packages.*.delivery_time' => 'nullable|string|max:120',
            'deliverables' => 'nullable|string|max:2000',
            'exclusions' => 'nullable|string|max:2000',
            'add_ons' => 'nullable|array|max:10',
            'add_ons.*.name' => 'required_with:add_ons|string|max:120',
            'add_ons.*.price' => 'required_with:add_ons|numeric|min:0',
            'add_ons.*.description' => 'nullable|string|max:500',
            'estimated_duration' => 'nullable|string|max:120',
            'requirements' => 'nullable|string|max:2000',
            'cancellation_terms' => 'nullable|string|max:2000',
            'revision_policy' => 'nullable|string|max:255',
            'is_available' => 'nullable|boolean',
            'submit' => 'nullable|boolean',
        ]);

        $submit = (bool) ($validated['submit'] ?? false);
        unset($validated['submit']);

        $category = \Modules\Needs\Entities\NeedCategory::find($validated['category_id']);
        if (! $category || ! $category->is_active) {
            return response()->json(['message' => 'This category is not accepting listings'], 422);
        }

        $id = (string) Str::uuid();

        $vendorId = \Modules\Vendors\Entities\Vendor::where('user_id', $request->user()->id)->value('id');

        // Raw insert: encode arrays explicitly (no model casts on this path).
        foreach (['packages', 'add_ons'] as $jsonKey) {
            if (array_key_exists($jsonKey, $validated) && $validated[$jsonKey] !== null) {
                $validated[$jsonKey] = json_encode($validated[$jsonKey]);
            }
        }

        DB::table('need_items')->insert(array_merge($validated, [
            'id' => $id,
            'user_id' => $request->user()->id,
            'vendor_id' => $vendorId,
            'is_available' => $validated['is_available'] ?? true,
            'status' => $submit
                ? \Modules\Needs\Entities\NeedItem::STATUS_SUBMITTED
                : \Modules\Needs\Entities\NeedItem::STATUS_DRAFT,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return response()->json([
            'message' => $submit ? 'Listing submitted for review' : 'Listing draft saved',
            'data' => ['id' => $id],
        ], 201);
    }

    /**
     * Owner revision: drafts/rejected freely; approved/published content
     * returns to review so the public listing always matches an approval.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $item = \Modules\Needs\Entities\NeedItem::find($id);
        if (! $item) {
            return response()->json(['message' => 'Listing not found'], 404);
        }

        if ((string) $item->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the owner can edit this listing'], 403);
        }

        if (! in_array($item->status, [
            \Modules\Needs\Entities\NeedItem::STATUS_DRAFT,
            \Modules\Needs\Entities\NeedItem::STATUS_REJECTED,
            \Modules\Needs\Entities\NeedItem::STATUS_APPROVED,
            \Modules\Needs\Entities\NeedItem::STATUS_PUBLISHED,
        ], true)) {
            return response()->json(['message' => "Listings cannot be edited in status '{$item->status}'"], 422);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:2000',
            'category_id' => 'sometimes|uuid|exists:need_categories,id',
            'price' => 'sometimes|nullable|numeric|min:0',
            'image_url' => 'sometimes|nullable|string|max:500',
            'packages' => 'sometimes|nullable|array|max:5',
            'packages.*.name' => 'required_with:packages|string|max:120',
            'packages.*.price' => 'required_with:packages|numeric|min:0',
            'packages.*.description' => 'nullable|string|max:500',
            'packages.*.delivery_time' => 'nullable|string|max:120',
            'deliverables' => 'sometimes|nullable|string|max:2000',
            'exclusions' => 'sometimes|nullable|string|max:2000',
            'add_ons' => 'sometimes|nullable|array|max:10',
            'add_ons.*.name' => 'required_with:add_ons|string|max:120',
            'add_ons.*.price' => 'required_with:add_ons|numeric|min:0',
            'add_ons.*.description' => 'nullable|string|max:500',
            'estimated_duration' => 'sometimes|nullable|string|max:120',
            'requirements' => 'sometimes|nullable|string|max:2000',
            'cancellation_terms' => 'sometimes|nullable|string|max:2000',
            'revision_policy' => 'sometimes|nullable|string|max:255',
            'is_available' => 'sometimes|boolean',
            'submit' => 'sometimes|boolean',
        ]);

        if (array_key_exists('category_id', $validated)) {
            $category = \Modules\Needs\Entities\NeedCategory::find($validated['category_id']);
            if (! $category || ! $category->is_active) {
                return response()->json(['message' => 'This category is not accepting listings'], 422);
            }
        }

        $submit = (bool) ($validated['submit'] ?? false);
        unset($validated['submit']);

        $wasLive = in_array($item->status, [
            \Modules\Needs\Entities\NeedItem::STATUS_APPROVED,
            \Modules\Needs\Entities\NeedItem::STATUS_PUBLISHED,
        ], true);

        $item->update(array_merge($validated, [
            'status' => $wasLive || $submit
                ? \Modules\Needs\Entities\NeedItem::STATUS_SUBMITTED
                : $item->status,
        ]));

        return response()->json([
            'message' => ($wasLive || $submit) ? 'Listing returned to review' : 'Listing updated',
            'data' => $item->fresh(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = DB::table('need_items')->find($id);

        if (!$item) {
            return response()->json(['message' => 'Need not found'], 404);
        }

        return response()->json(['data' => $item]);
    }

    /**
     * Agriculture marketplace: products in the agriculture category.
     */
    public function agriculture(Request $request): JsonResponse
    {
        $products = \Modules\Products\Entities\Product::query()
            ->where('is_active', true)
            ->whereNotNull('approved_at')
            ->where('category', 'ilike', '%agric%')
            ->with('vendor')
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Public deals listing. `category` filters by need-category slug
     * (spec §9 /deals/category/{slug}).
     */
    public function deals(Request $request): JsonResponse
    {
        $deals = \Modules\Needs\Entities\NeedItem::with('category:id,name,slug')
            ->where('status', \Modules\Needs\Entities\NeedItem::STATUS_PUBLISHED)
            ->where('is_available', true)
            ->whereHas('category', fn ($query) => $query->where('is_active', true));

        if ($slug = trim((string) $request->query('category'))) {
            $deals->whereHas('category', fn ($query) => $query->where('slug', $slug));
        }

        $deals = $deals
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 12));

        return response()->json([
            'data' => $deals->items(),
            'meta' => [
                'current_page' => $deals->currentPage(),
                'last_page' => $deals->lastPage(),
                'per_page' => $deals->perPage(),
                'total' => $deals->total(),
            ],
        ]);
    }

    /**
     * TODO 19 provider workspace: my listings with moderation states.
     */
    public function myListings(Request $request): JsonResponse
    {
        $items = \Modules\Needs\Entities\NeedItem::with('category:id,name,slug')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    /**
     * Single public deal - canonical slug first, UUID ids still work.
     * TODO 09: unpublished, unavailable, or inactive-category deals 404.
     */
    public function deal(string $id): JsonResponse
    {
        $deal = \Modules\Needs\Entities\NeedItem::with([
            'category:id,name,slug',
            'vendor:id,store_name,slug,is_verified,rating',
        ])
            ->where('status', \Modules\Needs\Entities\NeedItem::STATUS_PUBLISHED)
            ->where('is_available', true)
            ->whereHas('category', fn ($q) => $q->where('is_active', true))
            ->where(function ($query) use ($id) {
                $query->where('slug', $id);

                if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
                    $query->orWhere('id', $id);
                }
            })
            ->first();

        if (!$deal) {
            return response()->json(['message' => 'Deal not found'], 404);
        }

        return response()->json(['data' => $deal]);
    }
}
