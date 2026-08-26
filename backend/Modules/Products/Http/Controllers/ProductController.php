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
            $request->only(['search', 'category', 'vendor_id', 'brand_id', 'is_active']),
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
            // Admins publish directly.
            $data['approved_at'] = now();
            $data['is_active'] = true;
        } else {
            // Vendor submissions enter the admin approval queue, hidden until then.
            $data['is_active'] = false;
            $data['approved_at'] = null;
        }

        $product = $this->productService->create($data);

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

        $updated = $this->productService->update($id, collect($request->all())
            ->only(['name', 'description', 'category', 'subcategory', 'price', 'compare_price', 'image_url', 'images', 'stock_quantity', 'is_active'])
            ->filter(fn ($v) => $v !== null)
            ->all());

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

        return response()->json([
            'message' => 'Product archived successfully',
        ]);
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }
}
