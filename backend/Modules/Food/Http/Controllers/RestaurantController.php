<?php

namespace Modules\Food\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Food\Entities\Restaurant;
use Modules\Food\Entities\FoodOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Restaurant::where('is_active', true);

        if ($request->has('cuisine')) {
            $query->where('cuisine_type', $request->cuisine);
        }

        if ($request->has('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }

        $restaurants = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $restaurants->items(),
            'meta' => [
                'current_page' => $restaurants->currentPage(),
                'last_page' => $restaurants->lastPage(),
                'per_page' => $restaurants->perPage(),
                'total' => $restaurants->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $restaurant = Restaurant::with(['menuItems'])->find($id);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        return response()->json(['data' => $restaurant]);
    }

    public function order(Request $request, string $restaurantId): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'nullable|uuid',
            'items.*.id' => 'nullable|uuid',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.special_instructions' => 'nullable|string|max:500',
            'delivery_address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
            // N-42 scheduled orders: future slot, max 7 days out.
            'scheduled_for' => 'nullable|date|after:now|before:' . now()->addDays(7)->toIso8601String(),
        ]);

        $order = app(\Modules\Food\Actions\PlaceFoodOrder::class)->execute(
            $request->user()->id,
            $restaurantId,
            $validated['items'],
            [
                'delivery_address' => $validated['delivery_address'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'scheduled_for' => $validated['scheduled_for'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Order placed successfully',
            'data' => $order,
        ], 201);
    }

    public function menu(Request $request, string $id): JsonResponse
    {
        $restaurant = Restaurant::find($id);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        $items = \Modules\Food\Entities\MenuItem::where('restaurant_id', $id)
            ->when(!$this->canManage($request, $restaurant), fn ($q) => $q->where('is_available', true))
            ->orderBy('category')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function toggleMenuItem(Request $request, string $id): JsonResponse
    {
        $menuItem = \Modules\Food\Entities\MenuItem::with('restaurant')->find($id);

        if (!$menuItem) {
            return response()->json(['message' => 'Menu item not found'], 404);
        }

        if (!$this->canManage($request, $menuItem->restaurant)) {
            return response()->json(['message' => 'Only the restaurant owner can update menu items'], 403);
        }

        $menuItem->update(['is_available' => !$menuItem->is_available]);

        return response()->json([
            'message' => $menuItem->is_available ? 'Item is now available' : 'Item is now unavailable',
            'data' => $menuItem->fresh(),
        ]);
    }

    private function canManage(Request $request, ?Restaurant $restaurant): bool
    {
        if (!$restaurant || !$request->user()) {
            return false;
        }

        return $restaurant->user_id === $request->user()->id
            || $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }

    private function calculateTotal(array $items): float
    {
        $total = 0;
        foreach ($items as $item) {
            $menuItem = \Modules\Food\Entities\MenuItem::find($item['menu_item_id']);
            if ($menuItem) {
                $total += $menuItem->price * $item['quantity'];
            }
        }
        return $total;
    }

    /**
     * Admin console: every restaurant including inactive (public hides them).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = \Modules\Food\Entities\Restaurant::query()->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(fn ($q) => $q->where('name', 'ilike', "%{$search}%")->orWhere('city', 'ilike', "%{$search}%"));
        }
        if (in_array($request->get('status', 'all'), ['active', 'inactive'], true)) {
            $query->where('is_active', $request->get('status') === 'active');
        }

        $restaurants = $query->paginate($request->get('per_page', 25));

        return response()->json([
            'data' => $restaurants->items(),
            'meta' => [
                'current_page' => $restaurants->currentPage(),
                'last_page' => $restaurants->lastPage(),
                'per_page' => $restaurants->perPage(),
                'total' => $restaurants->total(),
            ],
        ]);
    }

    public function adminUpdate(Request $request, string $id): JsonResponse
    {
        $request->validate(['is_active' => 'required|boolean']);

        $restaurant = \Modules\Food\Entities\Restaurant::find($id);
        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }
        $restaurant->update(['is_active' => $request->boolean('is_active')]);

        return response()->json(['data' => $restaurant]);
    }

    /**
     * Admin console: create a restaurant (spec 47 — live in the public
     * listing, detail page, search and category navigation immediately).
     *
     * POST /api/admin/restaurants (role: super_admin, administrator, food_admin)
     */
    public function adminStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'cuisine_type' => 'required|string|max:100',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'image_url' => 'nullable|url|max:500',
            'opening_hours' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $restaurant = \Modules\Food\Entities\Restaurant::create(array_merge($data, [
            'user_id' => $request->user()?->id,
            'is_active' => $data['is_active'] ?? true,
        ]));

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'create',
                'entity_type' => 'restaurant',
                'entity_id' => $restaurant->id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['name' => $restaurant->name, 'city' => $restaurant->city],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break content creation.
        }

        return response()->json([
            'message' => 'Restaurant created successfully',
            'data' => $restaurant,
        ], 201);
    }
}
