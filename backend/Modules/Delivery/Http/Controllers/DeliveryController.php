<?php

namespace Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Delivery\Entities\Delivery;
use Modules\Delivery\Entities\DeliveryManager;
use Modules\Orders\Entities\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeliveryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DeliveryManager::query()->select([
            'id', 'full_name', 'vehicle_type', 'is_available', 'completed_deliveries', 'rating', 'created_at',
        ]);

        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        $perPage = min(max((int) $request->get('per_page', 15), 1), 100);
        $managers = $query->orderByDesc('rating')->paginate($perPage);

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

    public function show(Request $request, string $id): JsonResponse
    {
        $manager = DeliveryManager::find($id);

        if (!$manager) {
            return response()->json(['message' => 'Delivery manager not found'], 404);
        }

        $isSelf = $manager->user_id === Auth::id();
        if (!$isSelf && !$this->isAdmin($request) && !$request->user()->hasRole('vendor_admin')) {
            return response()->json(['message' => 'You do not have access to this delivery profile'], 403);
        }

        $data = $manager->only([
            'id', 'full_name', 'vehicle_type', 'is_available', 'completed_deliveries', 'rating', 'created_at',
        ]);
        if ($isSelf || $this->isAdmin($request)) {
            $data['phone'] = $manager->phone;
            $data['user_id'] = $manager->user_id;
        }

        return response()->json(['data' => $data]);
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

    private function ownManager(Request $request): ?DeliveryManager
    {
        return DeliveryManager::where('user_id', $request->user()->id)->first();
    }

    /**
     * Plan G2: attach a delivery row to a paid order (admin ops only).
     * One row per order - duplicates are rejected, never silently merged.
     */
    public function assign(Request $request, string $orderId): JsonResponse
    {
        if (! $this->isAdmin($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $order = Order::find($orderId);
        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if (! in_array($order->status, [Order::STATUS_PAID, Order::STATUS_CONFIRMED, Order::STATUS_PROCESSING, Order::STATUS_SHIPPED], true)) {
            return response()->json(['message' => 'Only paid or processing orders can be assigned for delivery.'], 422);
        }

        if (Delivery::where('order_id', $order->id)->exists()) {
            return response()->json(['message' => 'Order already has a delivery assignment.'], 422);
        }

        $validated = $request->validate([
            'manager_id' => 'nullable|uuid|exists:delivery_managers,id',
            'pickup_address' => 'nullable|string|max:500',
            'delivery_address' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        if (! empty($validated['manager_id'])) {
            $manager = DeliveryManager::find($validated['manager_id']);
            if (! $manager || ! $manager->is_available) {
                return response()->json(['message' => 'Manager is not available for assignment.'], 422);
            }
        }

        $delivery = null;
        try {
            $delivery = Delivery::create([
                'order_id' => $order->id,
                'manager_id' => $validated['manager_id'] ?? null,
                'status' => Delivery::STATUS_ASSIGNED,
                'pickup_address' => $validated['pickup_address'] ?? null,
                'delivery_address' => $validated['delivery_address'] ?? $order->shipping_address ?? null,
                'notes' => $validated['notes'] ?? null,
                'assigned_at' => now(),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // Concurrent double-assign: the loser hits the unique order_id
            // index instead of creating a second delivery row.
            if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                return response()->json(['message' => 'Order already has a delivery assignment.'], 422);
            }

            throw $e;
        }

        return response()->json(['message' => 'Delivery assigned.', 'data' => $delivery], 201);
    }

    /** Rider's active queue (own assignments only). */
    public function queue(Request $request): JsonResponse
    {
        $manager = $this->ownManager($request);
        if (! $manager) {
            return response()->json(['message' => 'Not registered as delivery manager'], 404);
        }

        $rows = Delivery::with('order:id,order_number,status,total_amount,user_id')
            ->where('manager_id', $manager->id)
            ->whereIn('status', Delivery::ACTIVE)
            ->orderBy('assigned_at')
            ->get();

        return response()->json(['data' => $rows]);
    }

    /** Rider's completed history. */
    public function history(Request $request): JsonResponse
    {
        $manager = $this->ownManager($request);
        if (! $manager) {
            return response()->json(['message' => 'Not registered as delivery manager'], 404);
        }

        $rows = Delivery::with('order:id,order_number,status,total_amount')
            ->where('manager_id', $manager->id)
            ->whereIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_FAILED])
            ->orderByDesc('delivered_at')
            ->paginate(20);

        return response()->json(['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(),
            'last_page' => $rows->lastPage(),
            'total' => $rows->total(),
        ]]);
    }

    /**
     * Rider advances their own delivery one strict step:
     * assigned -> picked_up -> in_transit -> delivered | failed.
     */
    public function transition(Request $request, string $id): JsonResponse
    {
        $manager = $this->ownManager($request);
        if (! $manager) {
            return response()->json(['message' => 'Not registered as delivery manager'], 404);
        }

        $delivery = Delivery::where('id', $id)->where('manager_id', $manager->id)->first();
        if (! $delivery) {
            return response()->json(['message' => 'Delivery not found'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:picked_up,in_transit,delivered,failed',
            'notes' => 'nullable|string|max:1000',
        ]);

        $allowed = [
            Delivery::STATUS_ASSIGNED => [Delivery::STATUS_PICKED_UP],
            Delivery::STATUS_PICKED_UP => [Delivery::STATUS_IN_TRANSIT],
            Delivery::STATUS_IN_TRANSIT => [Delivery::STATUS_DELIVERED, Delivery::STATUS_FAILED],
        ];

        if (! in_array($validated['status'], $allowed[$delivery->status] ?? [], true)) {
            return response()->json([
                'message' => "Cannot move delivery from {$delivery->status} to {$validated['status']}.",
            ], 422);
        }

        DB::transaction(function () use ($delivery, $validated, $manager) {
            $patch = ['status' => $validated['status']];
            if (array_key_exists('notes', $validated)) {
                $patch['notes'] = $validated['notes'];
            }
            if ($validated['status'] === Delivery::STATUS_PICKED_UP) {
                $patch['picked_up_at'] = now();
            }
            if (in_array($validated['status'], [Delivery::STATUS_DELIVERED, Delivery::STATUS_FAILED], true)) {
                $patch['delivered_at'] = now();
            }
            $delivery->update($patch);

            if ($validated['status'] === Delivery::STATUS_DELIVERED) {
                $manager->increment('completed_deliveries');
            }
        });

        return response()->json(['message' => 'Delivery updated.', 'data' => $delivery->fresh()]);
    }

    /** Customer tracking view for their own order's delivery. */
    public function trackingForOrder(Request $request, string $orderId): JsonResponse
    {
        $order = Order::where('id', $orderId)->where('user_id', $request->user()->id)->first();
        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $delivery = Delivery::where('order_id', $order->id)->first();
        if (! $delivery) {
            return response()->json(['data' => null, 'message' => 'No rider assigned yet.']);
        }

        return response()->json(['data' => $delivery]);
    }
}
