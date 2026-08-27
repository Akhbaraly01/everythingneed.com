<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Vendors\Entities\Vendor;

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

        return Inertia::render('vendors/Index', [
            'vendors' => $vendors,
            'filters' => $request->only(['search', 'category']),
        ]);
    }

    public function show(string $id): Response
    {
        $vendor = Vendor::with('products:id,vendor_id,name,price,image_url,rating,is_active')
            ->findOrFail($id);

        return Inertia::render('vendors/Show', [
            'vendor' => $vendor,
        ]);
    }
}
