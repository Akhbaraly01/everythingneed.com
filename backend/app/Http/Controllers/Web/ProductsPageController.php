<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Products\Entities\Product;
use Modules\Products\Entities\ProductReview;

class ProductsPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Product::where('is_active', true)
            // Same guard as the API: never surface unapproved submissions.
            ->whereNotNull('approved_at');

        if ($category = trim((string) $request->query('category'))) {
            $query->where('category', 'ilike', $category);
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $products = $query->applySort($request->query('sort'))
            ->paginate(20)
            ->withQueryString();

        // products/Index expects the wrapped {data, meta} contract (raw
        // paginators have no `meta` key and crash the page on .total).
        return Inertia::render('products/Index', [
            'products' => [
                'data' => $products->items(),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ],
            ],
            'filters' => $request->only(['category', 'search', 'sort']),
        ]);
    }

    /**
     * Spec §9 canonical product URL: /products/{slug}. Legacy /products/{id}
     * links 301 to the slug URL so inbound links keep working.
     */
    public function show(string $key): Response|RedirectResponse
    {
        $product = $this->resolve($key);

        if ($product->slug !== $key) {
            return redirect()->route('products.show', $product->slug, 301);
        }

        return Inertia::render('products/Show', [
            'product' => $product,
            'seo' => $this->productSeo($product),
        ]);
    }

    /**
     * Spec 88: crawlable head data for the canonical product URL -
     * OG/Twitter tags plus Product structured data (offers + rating).
     */
    private function productSeo(Product $product): array
    {
        $description = trim((string) $product->description) !== ''
            ? \Illuminate\Support\Str::limit(strip_tags((string) $product->description), 160)
            : $product->name;
        $image = $product->image_url ?? ($product->images[0] ?? null);
        if (is_string($image) && $image !== '' && str_starts_with($image, '/')) {
            $image = url($image);
        }
        $canonical = route('products.show', $product->slug);
        $currency = strtoupper((string) ($product->currency ?: \Core\Support\Currencies::default()));
        $inStock = $product->is_active && (int) $product->stock_quantity > 0;
        $storeName = $product->vendor?->store_name;

        $jsonLd = array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $product->name,
            'description' => $description,
            'sku' => $product->sku,
            'image' => $image,
            'brand' => $storeName !== null ? ['@type' => 'Brand', 'name' => $storeName] : null,
            'offers' => [
                '@type' => 'Offer',
                'url' => $canonical,
                'priceCurrency' => $currency,
                'price' => (float) $product->price,
                'availability' => $inStock
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
            ],
            'aggregateRating' => ((float) ($product->rating ?? 0) > 0 && (int) ($product->reviews_count ?? 0) > 0)
                ? [
                    '@type' => 'AggregateRating',
                    'ratingValue' => (float) $product->rating,
                    'reviewCount' => (int) $product->reviews_count,
                ]
                : null,
        ], fn ($value) => $value !== null);

        return [
            'title' => $product->name,
            'description' => $description,
            'image' => $image,
            'canonical' => $canonical,
            'type' => 'product',
            'json_ld' => [$jsonLd],
        ];
    }

    /** Spec §9: /products/{slug}/reviews */
    public function reviews(string $key): Response|RedirectResponse
    {
        $product = $this->resolve($key);

        if ($product->slug !== $key) {
            return redirect()->route('products.reviews', $product->slug, 301);
        }

        $reviews = ProductReview::where('product_id', $product->id)
            ->join('users', 'users.id', '=', 'product_reviews.user_id')
            ->select('product_reviews.*', 'users.name as reviewer_name')
            ->orderByDesc('product_reviews.created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('products/Reviews', [
            'product' => $product,
            'reviews' => $reviews,
        ]);
    }

    /** Spec §9: /products/{slug}/vendor */
    public function vendor(string $key): Response|RedirectResponse
    {
        $product = $this->resolve($key);

        if ($product->slug !== $key) {
            return redirect()->route('products.vendor', $product->slug, 301);
        }

        $vendor = $product->vendor
            ?->load(['products' => fn ($query) => $query
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->limit(12)]);

        if (! $vendor) {
            abort(404);
        }

        return Inertia::render('products/Vendor', [
            'product' => $product,
            'vendor' => $vendor,
        ]);
    }

    private function resolve(string $key): Product
    {
        return Product::with('vendor:id,store_name,slug,is_verified,rating')
            ->where('is_active', true)
            ->where(function ($query) use ($key) {
                $query->where('slug', $key);

                if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $key)) {
                    $query->orWhere('id', $key);
                }
            })
            ->firstOrFail();
    }
}
