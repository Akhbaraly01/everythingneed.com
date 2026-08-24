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
        $restaurant = Restaurant::find($restaurantId);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        $order = FoodOrder::create(array_merge($request->validate([
            'items' => 'required|array',
            'items.*.menu_item_id' => 'required|uuid',
            'items.*.quantity' => 'required|integer|min:1',
            'delivery_address' => 'required|string|max:500',
        ]), [
            'user_id' => $request->user()->id,
            'restaurant_id' => $restaurantId,
            'total' => $this->calculateTotal($request->items),
        ]));

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
}
