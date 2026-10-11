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
        $categories = DB::table('need_categories')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function items(Request $request): JsonResponse
    {
        $query = DB::table('need_items')->orderByDesc('created_at');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Spec S10: browse a category by slug (need_categories.slug).
        if ($request->filled('category')) {
            $category = \Modules\Needs\Entities\NeedCategory::where('slug', $request->category)->first();
            $query->where('category_id', $category?->id);
        }

        if ($request->has('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->has('is_available')) {
            $query->where('is_available', filter_var($request->is_available, FILTER_VALIDATE_BOOLEAN));
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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'category_id' => 'required|uuid|exists:need_categories,id',
            'price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|string|max:500',
        ]);

        $id = (string) Str::uuid();

        $vendorId = \Modules\Vendors\Entities\Vendor::where('user_id', $request->user()->id)->value('id');

        DB::table('need_items')->insert(array_merge($validated, [
            'id' => $id,
            'vendor_id' => $vendorId,
            'is_available' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return response()->json(['message' => 'Need published', 'data' => ['id' => $id]], 201);
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
            ->where('is_available', true);

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
     * Single public deal - canonical slug first, UUID ids still work.
     */
    public function deal(string $id): JsonResponse
    {
        $deal = \Modules\Needs\Entities\NeedItem::with([
            'category:id,name,slug',
            'vendor:id,store_name,slug,is_verified,rating',
        ])
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
