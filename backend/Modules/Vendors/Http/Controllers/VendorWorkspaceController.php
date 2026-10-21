<?php

namespace Modules\Vendors\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Bookings\Entities\Booking;
use Modules\Reviews\Services\ProductReviewFeed;
use Modules\Vendors\Entities\Vendor;
use Modules\Vendors\Entities\VendorService;

/**
 * Spec §34 vendor workspace: profile, settings, services, bookings and
 * reviews - every query is scoped to the caller's own vendor.
 */
class VendorWorkspaceController extends Controller
{
    public function __construct(private ProductReviewFeed $reviews) {}

    public function profile(Request $request): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        return response()->json([
            'data' => [
                'vendor' => $vendor,
                'user' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                ],
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
        ]);

        $vendor->update($validated);

        return response()->json([
            'message' => 'Vendor profile updated',
            'data' => $vendor->fresh(),
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        $validated = $request->validate([
            'accepting_orders' => 'required|boolean',
        ]);

        $settings = $vendor->settings ?? [];
        $settings['accepting_orders'] = (bool) $validated['accepting_orders'];
        $vendor->update(['settings' => $settings]);

        return response()->json([
            'message' => 'Vendor settings updated',
            'data' => $vendor->fresh(),
        ]);
    }

    public function services(Request $request): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        $services = VendorService::where('vendor_id', $vendor->id)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $services->items(),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page' => $services->lastPage(),
                'per_page' => $services->perPage(),
                'total' => $services->total(),
            ],
        ]);
    }

    public function showService(Request $request, string $id): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        $service = VendorService::where('vendor_id', $vendor->id)->find($id);
        if (! $service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        return response()->json(['data' => $service]);
    }

    public function storeService(Request $request): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'price' => 'required|numeric|min:0|max:999999',
            'duration_minutes' => 'nullable|integer|min:1|max:10080',
            'is_active' => 'nullable|boolean',
        ]);

        $service = VendorService::create($validated + ['vendor_id' => $vendor->id]);

        return response()->json([
            'message' => 'Service created',
            'data' => $service,
        ], 201);
    }

    public function updateService(Request $request, string $id): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        $service = VendorService::where('vendor_id', $vendor->id)->find($id);
        if (! $service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'price' => 'sometimes|required|numeric|min:0|max:999999',
            'duration_minutes' => 'nullable|integer|min:1|max:10080',
            'is_active' => 'nullable|boolean',
        ]);

        $service->update($validated);

        return response()->json([
            'message' => 'Service updated',
            'data' => $service->fresh(),
        ]);
    }

    public function destroyService(Request $request, string $id): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        $service = VendorService::where('vendor_id', $vendor->id)->find($id);
        if (! $service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        $service->delete();

        return response()->json(['message' => 'Service deleted']);
    }

    /** Reviews on the vendor's products (spec §34 /vendor/reviews). */
    public function reviews(Request $request): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        $reviews = $this->reviews->forProducts(
            $vendor->products()->select('id')->pluck('id')->all(),
            (int) $request->get('per_page', 15)
        );

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    /** Bookings against this vendor's services (spec §34 /vendor/bookings). */
    public function bookings(Request $request): JsonResponse
    {
        $vendor = $this->ownVendor($request);
        if ($vendor instanceof JsonResponse) {
            return $vendor;
        }

        $serviceIds = VendorService::where('vendor_id', $vendor->id)->pluck('id');

        $bookings = Booking::with('user:id,name,email')
            ->where('service_type', 'vendor_service')
            ->whereIn('service_id', $serviceIds)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->status))
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $bookings->items(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    private function ownVendor(Request $request): Vendor|JsonResponse
    {
        $vendor = Vendor::where('user_id', $request->user()->id)->first();

        if (! $vendor) {
            return response()->json(['message' => 'Vendor profile required'], 403);
        }

        return $vendor;
    }
}
