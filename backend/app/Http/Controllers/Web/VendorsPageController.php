<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Products\Entities\ProductReview;
use Modules\Vendors\Entities\Vendor;
use Modules\Vendors\Entities\VendorService;

class VendorsPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Vendor::query();

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('store_name', 'ilike', "%{$search}%")
                    ->orWhere('category', 'ilike', "%{$search}%");
            });
        }

        if ($category = trim((string) $request->query('category'))) {
            $query->where('category', 'ilike', $category);
        }

        $vendors = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        // Distinct category list for the filter dropdown (cheap: one indexed scan).
        $categories = Vendor::query()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('vendors/Index', [
            'vendors' => $vendors,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category']),
        ]);
    }

    /**
     * Spec §9 canonical vendor URL: /vendors/{slug}. Legacy /vendors/{id}
     * links 301 to the slug URL.
     */
    public function show(string $key): Response|RedirectResponse
    {
        $vendor = $this->resolve($key);

        if ($vendor->slug !== $key) {
            return redirect()->route('vendors.show', $vendor->slug, 301);
        }

        $vendor->load(['products' => fn ($query) => $query->where('is_active', true)]);

        return Inertia::render('vendors/Show', [
            'vendor' => $vendor,
        ]);
    }

    /** Spec §9: /vendors/{slug}/products */
    public function products(string $key): Response|RedirectResponse
    {
        $vendor = $this->resolve($key);

        if ($vendor->slug !== $key) {
            return redirect()->route('vendors.products', $vendor->slug, 301);
        }

        $products = $vendor->products()
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('vendors/Products', [
            'vendor' => $vendor,
            'products' => $products,
        ]);
    }

    /** Spec §9: /vendors/{slug}/services */
    public function services(string $key): Response|RedirectResponse
    {
        $vendor = $this->resolve($key);

        if ($vendor->slug !== $key) {
            return redirect()->route('vendors.services', $vendor->slug, 301);
        }

        $services = VendorService::where('vendor_id', $vendor->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('vendors/Services', [
            'vendor' => $vendor,
            'services' => $services,
        ]);
    }

    /** Spec §9: /vendors/{slug}/reviews */
    public function reviews(string $key): Response|RedirectResponse
    {
        $vendor = $this->resolve($key);

        if ($vendor->slug !== $key) {
            return redirect()->route('vendors.reviews', $vendor->slug, 301);
        }

        $reviews = ProductReview::whereIn('product_id', $vendor->products()->select('id'))
            ->join('users', 'users.id', '=', 'product_reviews.user_id')
            ->join('products', 'products.id', '=', 'product_reviews.product_id')
            ->select('product_reviews.*', 'users.name as reviewer_name', 'products.name as product_name')
            ->orderByDesc('product_reviews.created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('vendors/Reviews', [
            'vendor' => $vendor,
            'reviews' => $reviews,
        ]);
    }

    private function resolve(string $key): Vendor
    {
        return Vendor::where(function ($query) use ($key) {
            $query->where('slug', $key);

            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $key)) {
                $query->orWhere('id', $key);
            }
        })->firstOrFail();
    }
}
