<?php

use Illuminate\Support\Facades\Route;
use Modules\Food\Http\Controllers\RestaurantController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/restaurants/{id}/order', [RestaurantController::class, 'order']);
        Route::put('/menu-items/{id}/toggle', [RestaurantController::class, 'toggleMenuItem']);
    });

    // Public reads
    Route::get('/restaurants', [RestaurantController::class, 'index']);
    Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);
    Route::get('/restaurants/{id}/menu', [RestaurantController::class, 'menu']);

    // Compat for deep pages: food cart/history (maps to food_orders)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/food/cart', function (\Illuminate\Http\Request $request) {
            $cart = \Illuminate\Support\Facades\DB::table('carts')->where('user_id', $request->user()->id)->first();
            $items = $cart ? \Illuminate\Support\Facades\DB::table('cart_items_v2')->where('cart_id', $cart->id)->get() : collect([]);
            return response()->json(['data' => ['restaurant' => null, 'items' => $items, 'cart' => $cart]]);
        });
        Route::get('/food/orders', function (\Illuminate\Http\Request $request) {
            $orders = \Modules\Food\Entities\FoodOrder::where('user_id', $request->user()->id)->with('restaurant:id,name')->orderByDesc('created_at')->get();
            return response()->json(['data' => $orders]);
        });
        Route::post('/food/orders', function (\Illuminate\Http\Request $request) {
            $validated = $request->validate(['restaurant_id' => 'required|uuid', 'items' => 'required|array', 'delivery_address' => 'required|string', 'phone' => 'nullable|string', 'notes' => 'nullable|string']);
            $restaurant = \Modules\Food\Entities\Restaurant::find($validated['restaurant_id']);
            if (!$restaurant) return response()->json(['message' => 'Restaurant not found'], 404);
            $total = 0; foreach ($validated['items'] as $it) { $m = \Modules\Food\Entities\MenuItem::find($it['menu_item_id'] ?? $it['id'] ?? null); if ($m) $total += $m->price * ($it['quantity'] ?? 1); }
            $order = \Modules\Food\Entities\FoodOrder::create(['user_id' => $request->user()->id, 'restaurant_id' => $validated['restaurant_id'], 'order_number' => 'FO-' . strtoupper(\Illuminate\Support\Str::random(8)), 'delivery_address' => $validated['delivery_address'], 'total_amount' => $total, 'status' => 'pending']);
            return response()->json(['data' => $order], 201);
        });
    });
});
