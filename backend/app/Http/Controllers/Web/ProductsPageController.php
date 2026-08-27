<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Products\Entities\Product;

class ProductsPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Product::where('is_active', true);

        if ($category = trim((string) $request->query('category'))) {
            $query->where('category', 'ilike', $category);
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $products = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        return Inertia::render('products/Index', [
            'products' => $products,
            'filters' => $request->only(['category', 'search']),
        ]);
    }

    public function show(string $id): Response
    {
        $product = Product::with('vendor:id,store_name,is_verified,rating')
            ->where('is_active', true)
            ->findOrFail($id);

        return Inertia::render('products/Show', [
            'product' => $product,
        ]);
    }
}
