<?php

namespace Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Delivery\Entities\DeliveryManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DeliveryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DeliveryManager::with('user');

        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        $managers = $query->orderByDesc('rating')->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $managers->items(),
            'meta' => [
                'current_page' => $managers->currentPage(),
                'last_page' => $managers->lastPage(),
                'per_page' => $managers->perPage(),
                'total' => $managers->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'vehicle_type' => 'nullable|string|max:100',
        ]);

        $manager = DeliveryManager::create([
            'user_id' => Auth::id(),
            'full_name' => $request->full_name,
            'phone' => $request->phone,
            'vehicle_type' => $request->vehicle_type,
            'is_available' => true,
            'completed_deliveries' => 0,
            'rating' => 0,
        ]);

        return response()->json([
            'message' => 'Delivery manager registered',
            'data' => $manager,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $manager = DeliveryManager::with('user')->find($id);

        if (!$manager) {
            return response()->json(['message' => 'Delivery manager not found'], 404);
        }

        return response()->json(['data' => $manager]);
    }

    public function updateAvailability(Request $request): JsonResponse
    {
        $request->validate(['is_available' => 'required|boolean']);

        $manager = DeliveryManager::where('user_id', Auth::id())->firstOrFail();
        $manager->update(['is_available' => $request->is_available]);

        return response()->json([
            'message' => 'Availability updated',
            'data' => $manager,
        ]);
    }

    public function myDeliveries(): JsonResponse
    {
        $manager = DeliveryManager::where('user_id', Auth::id())->first();

        if (!$manager) {
            return response()->json(['message' => 'Not registered as delivery manager'], 404);
        }

        return response()->json([
            'data' => [
                'completed_deliveries' => $manager->completed_deliveries,
                'rating' => $manager->rating,
                'is_available' => $manager->is_available,
            ],
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $manager = DeliveryManager::find($id);

        if (!$manager) {
            return response()->json(['message' => 'Delivery manager not found'], 404);
        }

        if ($manager->user_id !== Auth::id() && !$this->isAdmin($request)) {
            return response()->json(['message' => 'You do not manage this delivery profile'], 403);
        }

        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'vehicle_type' => 'nullable|string|max:100',
            'is_available' => 'sometimes|boolean',
        ]);

        $manager->update($validated);

        return response()->json([
            'message' => 'Delivery manager updated',
            'data' => $manager->fresh(),
        ]);
    }

    public function markDelivered(Request $request, string $id): JsonResponse
    {
        return $this->recordCompletion($request, $id, true);
    }

    public function markFailed(Request $request, string $id): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        return $this->recordCompletion($request, $id, false, $request->get('reason'));
    }

    public function rates(Request $request): JsonResponse
    {
        $baseRate = (float) config('services.delivery.base_rate', 5.99);
        $perKmRate = (float) config('services.delivery.per_km_rate', 0.85);
        $currency = config('services.delivery.currency', 'USD');

        $distanceKm = $request->filled('distance_km')
            ? max(0.0, (float) $request->distance_km)
            : null;

        return response()->json([
            'data' => [
                'currency' => $currency,
                'base_rate' => $baseRate,
                'per_km_rate' => $perKmRate,
                'estimated_total' => $distanceKm !== null
                    ? round($baseRate + ($distanceKm * $perKmRate), 2)
                    : null,
                'distance_km' => $distanceKm,
            ],
        ]);
    }

    private function recordCompletion(Request $request, string $id, bool $success, ?string $reason = null): JsonResponse
    {
        $manager = DeliveryManager::find($id);

        if (!$manager) {
            return response()->json(['message' => 'Delivery manager not found'], 404);
        }

        if ($manager->user_id !== Auth::id() && !$this->isAdmin($request)) {
            return response()->json(['message' => 'You do not manage this delivery profile'], 403);
        }

        if ($success) {
            $manager->increment('completed_deliveries');
        }

        return response()->json([
            'message' => $success
                ? 'Delivery recorded as completed'
                : 'Delivery recorded as failed',
            'data' => [
                'delivery_manager_id' => $manager->id,
                'outcome' => $success ? 'delivered' : 'failed',
                'reason' => $reason,
                'completed_deliveries' => $manager->fresh()->completed_deliveries,
            ],
        ]);
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }
}
