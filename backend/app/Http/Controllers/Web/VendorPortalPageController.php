<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Orders\Entities\VendorOrder;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;

class VendorPortalPageController extends Controller
{
    private function vendor(Request $request): Vendor
    {
        $vendor = Vendor::where('user_id', $request->user()->id)->first();

        abort_unless($vendor !== null, 404, 'You do not have a vendor account yet.');

        return $vendor;
    }

    public function dashboard(Request $request): Response
    {
        $vendor = $this->vendor($request);

        $stats = [
            'products' => Product::where('vendor_id', $vendor->id)->count(),
            'active_products' => Product::where('vendor_id', $vendor->id)->where('is_active', true)->count(),
            'orders_total' => VendorOrder::where('vendor_id', $vendor->id)->count(),
            'orders_pending' => VendorOrder::where('vendor_id', $vendor->id)->where('status', VendorOrder::STATUS_PENDING)->count(),
            'revenue_delivered' => (float) VendorOrder::where('vendor_id', $vendor->id)
                ->where('status', VendorOrder::STATUS_DELIVERED)
                ->sum('total_price'),
            'rating' => (float) $vendor->rating,
        ];

        $recentOrders = VendorOrder::with('customer:id,name')
            ->where('vendor_id', $vendor->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return Inertia::render('vendor/Dashboard', [
            'vendor' => $vendor->only(['id', 'store_name', 'category', 'is_verified', 'rating']),
            'stats' => $stats,
            'recentOrders' => $recentOrders,
        ]);
    }

    public function products(Request $request): Response
    {
        $vendor = $this->vendor($request);

        $products = Product::where('vendor_id', $vendor->id)
            ->orderByDesc('created_at')
            ->paginate(10);

        return Inertia::render('vendor/Products', [
            'products' => $products,
        ]);
    }

    public function orders(Request $request): Response
    {
        $vendor = $this->vendor($request);

        $orders = VendorOrder::with('customer:id,name')
            ->where('vendor_id', $vendor->id)
            ->orderByDesc('created_at')
            ->paginate(12);

        return Inertia::render('vendor/Orders', [
            'orders' => $orders,
        ]);
    }

    public function payouts(): Response
    {
        // Summary + withdrawals load client-side from /api/vendor/earnings.
        return Inertia::render('vendor/Payouts');
    }
}
