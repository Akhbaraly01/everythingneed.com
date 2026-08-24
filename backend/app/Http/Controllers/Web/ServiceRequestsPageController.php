<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceRequestsPageController extends Controller
{
    /**
     * Unified "My requests" board across Deals / Needs verticals.
     */
    public function requests(Request $request): Response
    {
        $requests = \Modules\Needs\Entities\NeedRequest::with(['offers', 'category:id,name'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(12);

        $requests->getCollection()->transform(function ($r) {
            // Attach category fallback name if the pivot is missing
            $r->category_name = $r->category?->name ?? 'General request';

            return $r;
        });

        return Inertia::render('requests/Index', [
            'requests' => $requests,
        ]);
    }

    public function agriculture(Request $request): Response
    {
        $query = \Modules\Products\Entities\Product::query()
            ->where('is_active', true)
            ->where('category', 'ilike', '%agric%')
            ->with('vendor:id,store_name,rating');

        if ($q = trim((string) $request->query('q'))) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'ilike', "%{$q}%")
                    ->orWhere('description', 'ilike', "%{$q}%");
            });
        }

        $products = $query->orderByDesc('created_at')->paginate(12)->withQueryString();

        return Inertia::render('agriculture/Index', [
            'products' => $products,
            'filters' => ['q' => $request->query('q')],
        ]);
    }

    public function buildingServices(Request $request): Response
    {
        $services = \Illuminate\Support\Facades\DB::table('service_workers')
            ->where('is_available', true)
            ->orderByDesc('rating')
            ->get();

        $myBookings = $request->user()
            ? \Illuminate\Support\Facades\DB::table('building_service_bookings')
                ->where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
            : collect();

        return Inertia::render('building-services/Index', [
            'services' => $services,
            'myBookings' => $myBookings,
        ]);
    }
}
