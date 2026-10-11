<?php

namespace Tests\Feature\Food;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Food\Entities\FoodOrder;
use Modules\Food\Entities\MenuItem;
use Modules\Food\Entities\Restaurant;
use Tests\TestCase;

class FoodOrderFlowTest extends TestCase
{
    use RefreshDatabase;

    private function makeRestaurant(): Restaurant
    {
        return Restaurant::create([
            'name' => 'Gold Bites',
            'cuisine_type' => 'ghanaian',
            'address' => '1 Food St',
            'city' => 'Accra',
            'is_active' => true,
            'rating' => 4.5,
        ]);
    }

    public function test_guest_can_list_and_show_restaurants(): void
    {
        $r = $this->makeRestaurant();
        MenuItem::create([
            'restaurant_id' => $r->id,
            'name' => 'Jollof',
            'price' => 25,
            'category' => 'mains',
            'is_available' => true,
        ]);

        $this->getJson('/api/restaurants')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/restaurants/{$r->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Gold Bites');

        $this->getJson('/api/restaurants/'.Str::uuid())->assertNotFound();
    }

    public function test_guest_cannot_order(): void
    {
        $r = $this->makeRestaurant();
        $this->postJson("/api/restaurants/{$r->id}/order", [
            'items' => [],
            'delivery_address' => 'x',
        ])->assertUnauthorized();
    }

    public function test_user_can_create_food_order_and_list_own_only(): void
    {
        $me = $this->actingAsUser();
        $r = $this->makeRestaurant();
        $item = MenuItem::create([
            'restaurant_id' => $r->id,
            'name' => 'Fufu',
            'price' => 30,
            'category' => 'mains',
            'is_available' => true,
        ]);

        $other = $this->createUser();
        FoodOrder::create([
            'user_id' => $other->id,
            'restaurant_id' => $r->id,
            'order_number' => 'FO-OTHER',
            'delivery_address' => 'Elsewhere',
            'total_amount' => 1,
            'status' => 'pending',
        ]);

        $res = $this->postJson('/api/food/orders', [
            'restaurant_id' => $r->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
            'delivery_address' => 'My House',
        ]);
        $res->assertCreated();
        $this->assertEqualsWithDelta(60.0, (float) $res->json('data.total_amount'), 0.01);

        $list = $this->getJson('/api/food/orders');
        $list->assertOk();
        $this->assertSame(1, count($list->json('data')));
        $this->assertSame($me->id, $list->json('data.0.user_id'));

        $orderId = $res->json('data.id');
        $this->getJson("/api/food/orders/{$orderId}")->assertOk();
        $this->getJson('/api/food/orders/'.Str::uuid())->assertNotFound();
    }

    public function test_food_order_requires_restaurant_and_items(): void
    {
        $this->actingAsUser();
        $this->postJson('/api/food/orders', [
            'restaurant_id' => (string) Str::uuid(),
            'delivery_address' => 'x',
        ])->assertStatus(422);

        $r = $this->makeRestaurant();
        $this->postJson('/api/food/orders', [
            'restaurant_id' => $r->id,
            'items' => [],
            'delivery_address' => 'x',
        ])->assertStatus(422);
    }
}
