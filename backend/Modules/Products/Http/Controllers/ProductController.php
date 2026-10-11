<?php

namespace Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Products\Services\ProductService;
use Modules\Products\Http\Requests\StoreProductRequest;
use Modules\Products\Http\Resources\ProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $products = $this->productService->getProducts(
            $request->only(['search', 'category', 'vendor_id', 'brand_id', 'is_active', 'sort']),
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => ProductResource::collection($products->items()),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $product = $this->productService->getProduct($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json([
            'data' => new ProductResource($product),
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $vendor = \Modules\Vendors\Entities\Vendor::find($request->validated('vendor_id'));

        if (!$vendor || ($vendor->user_id !== $request->user()->id && !$this->isAdmin($request))) {
            return response()->json(['message' => 'You may only create products for your own vendor account'], 403);
        }

        $data = $request->validated();

        if ($this->isAdmin($request)) {
            // Admins choose the publication state (spec 37: Draft/Published/
            // Hidden/Archived); only Published is live on the marketplace.
            $state = $data['publication_state'] ?? 'published';
            $data['publication_state'] = $state;
            $data['is_active'] = $state === 'published';
            $data['approved_at'] = now();
        } else {
            // Vendor submissions enter the admin approval queue, hidden until then.
            $data['publication_state'] = 'draft';
            $data['is_active'] = false;
            $data['approved_at'] = null;
        }

        $product = $this->productService->create($data);

        $this->auditProduct('create', $product->id, $request, null, [
            'name' => $product->name, 'price' => $product->price, 'is_active' => (bool) $product->is_active,
        ]);

        return response()->json([
            'message' => $data['approved_at']
                ? 'Product created successfully'
                : 'Product submitted for approval',
            'data' => new ProductResource($product),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $product = \Modules\Products\Entities\Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $vendor = \Modules\Vendors\Entities\Vendor::find($product->vendor_id);

        if (!$vendor || ($vendor->user_id !== $request->user()->id && !$this->isAdmin($request))) {
            return response()->json(['message' => 'You do not own this product'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|nullable|string|max:160|unique:products,slug,'.$id,
            'description' => 'sometimes|nullable|string|max:2000',
            'category' => 'sometimes|string|max:100',
            'subcategory' => 'sometimes|nullable|string|max:100',
            'sku' => 'sometimes|nullable|string|max:64',
            'price' => 'sometimes|numeric|min:0',
            'compare_price' => 'sometimes|nullable|numeric|min:0',
            'currency' => 'sometimes|nullable|string|size:3',
            'tax_rate' => 'sometimes|nullable|numeric|min:0|max:100',
            'discount_percent' => 'sometimes|nullable|numeric|min:0|max:100',
            'featured' => 'sometimes|boolean',
            'publication_state' => 'sometimes|string|in:draft,published,hidden,archived',
            'specifications' => 'sometimes|nullable|array',
            'attributes' => 'sometimes|nullable|array',
            'shipping' => 'sometimes|nullable|array',
            'image_url' => 'sometimes|nullable|url|max:500',
            'images' => 'sometimes|nullable|array',
            'stock_quantity' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'variants' => 'sometimes|nullable|array',
            'variants.*.name' => 'required|string|max:120',
            'variants.*.sku' => 'nullable|string|max:64',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.stock_quantity' => 'nullable|integer|min:0',
            'variants.*.attributes' => 'nullable|array',
            'variants.*.is_active' => 'nullable|boolean',
        ]);

        $payload = collect($request->all())
            ->only([
                'name', 'slug', 'description', 'category', 'subcategory', 'sku',
                'price', 'compare_price', 'currency', 'tax_rate', 'discount_percent',
                'featured', 'publication_state', 'specifications', 'attributes',
                'shipping', 'image_url', 'images', 'stock_quantity', 'is_active',
                'variants',
            ])
            ->filter(fn ($v) => $v !== null)
            ->all();

        // The publication state drives marketplace visibility (spec 37).
        if (array_key_exists('publication_state', $payload)) {
            $payload['is_active'] = $payload['publication_state'] === 'published';
        }

        $updated = $this->productService->update($id, $payload);

        $fresh = \Modules\Products\Entities\Product::find($id);
        $this->auditProduct('update', $id, $request, [
            'name' => $product->name, 'price' => $product->price, 'is_active' => (bool) $product->is_active,
        ], [
            'name' => $fresh->name, 'price' => $fresh->price, 'is_active' => (bool) $fresh->is_active,
        ]);

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => new ProductResource($updated),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $product = \Modules\Products\Entities\Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $vendor = \Modules\Vendors\Entities\Vendor::find($product->vendor_id);

        if (!$vendor || ($vendor->user_id !== $request->user()->id && !$this->isAdmin($request))) {
            return response()->json(['message' => 'You do not own this product'], 403);
        }

        $this->productService->archive($id);

        $this->auditProduct('delete', $id, $request, [
            'name' => $product->name, 'price' => $product->price, 'archived' => false,
        ], ['archived' => true]);

        return response()->json([
            'message' => 'Product archived successfully',
        ]);
    }

    /**
     * Product/price changes are sensitive (spec §66). Audit failures never
     * block the mutation itself.
     */
    private function auditProduct(string $action, string $productId, Request $request, ?array $old, ?array $new): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action'       => $action,
                'entity_type'  => 'product',
                'entity_id'    => $productId,
                'performed_by' => $request->user()?->id,
                'old_values'   => $old,
                'new_values'   => $new,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break product mutations.
        }
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }

    /**
     * The current user's comparison list (Engagement is the source of truth).
     */
    public function comparison(Request $request): JsonResponse
    {
        $ids = \Modules\Engagement\Entities\ProductComparison::where('user_id', $request->user()?->id ?? null)
            ->pluck('product_id');
        $products = \Modules\Products\Entities\Product::whereIn('id', $ids)->get();

        return response()->json(['data' => $products]);
    }
}
