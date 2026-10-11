<?php

namespace Modules\Food\Actions;

use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Food\Entities\FoodOrder;
use Modules\Food\Entities\FoodOrderItem;
use Modules\Food\Entities\MenuItem;
use Modules\Food\Entities\Restaurant;

class PlaceFoodOrder
{
    /**
     * Place a food order with real line items: every item must exist,
     * belong to the restaurant and be available; totals are server-computed.
     */
    public function execute(string $userId, string $restaurantId, array $items, array $meta): FoodOrder
    {
        $restaurant = Restaurant::find($restaurantId);
        if (!$restaurant) {
            throw new NotFoundException('Restaurant', $restaurantId);
        }

        if (isset($restaurant->is_active) && !$restaurant->is_active) {
            throw new ValidationException('Restaurant is not accepting orders');
        }

        if ($items === []) {
            throw new ValidationException('Order must contain at least one item');
        }

        $total = 0;
        $lines = [];
        foreach ($items as $it) {
            $menuItemId = $it['menu_item_id'] ?? $it['id'] ?? null;
            $quantity = max(1, (int) ($it['quantity'] ?? 1));

            $menuItem = $menuItemId ? MenuItem::find($menuItemId) : null;
            if (!$menuItem) {
                throw new NotFoundException('Menu item', (string) $menuItemId);
            }
            if ((string) $menuItem->restaurant_id !== (string) $restaurant->id) {
                throw new ValidationException("{$menuItem->name} does not belong to this restaurant");
            }
            if (!$menuItem->is_available) {
                throw new ValidationException("{$menuItem->name} is not available");
            }

            $total += (float) $menuItem->price * $quantity;
            $lines[] = [
                'menu' => $menuItem,
                'quantity' => $quantity,
                'instructions' => isset($it['special_instructions']) ? (string) $it['special_instructions'] : null,
            ];
        }

        return DB::transaction(function () use ($userId, $restaurant, $total, $lines, $meta) {
            $order = FoodOrder::create([
                'user_id' => $userId,
                'restaurant_id' => $restaurant->id,
                'order_number' => 'FO-'.strtoupper(Str::random(8)),
                'delivery_address' => $meta['delivery_address'] ?? 'Address on file',
                'phone' => $meta['phone'] ?? null,
                'notes' => $meta['notes'] ?? null,
                'total_amount' => $total,
                'status' => 'pending',
            ]);

            foreach ($lines as $line) {
                FoodOrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $line['menu']->id,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['menu']->price,
                    'special_instructions' => $line['instructions'],
                ]);
            }

            return $order->fresh('items');
        });
    }
}
