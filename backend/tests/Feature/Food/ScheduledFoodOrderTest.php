<?php

namespace Tests\Feature\Food;

use Illuminate\Support\Str;
use Modules\Food\Entities\MenuItem;
use Modules\Food\Entities\Restaurant;
use Tests\TestCase;

/**
 * N-42 food scheduled orders: optional future delivery slot, bounded
 * to 7 days, immediate orders unchanged.
 */
class ScheduledFoodOrderTest extends TestCase
{
    private function makeRestaurant(): Restaurant
    {
        return Restaurant::create([
            'name' => 'Schedule Bites',
            'cuisine_type' => 'ghanaian',
            'address' => '1 Food St',
            'city' => 'Accra',
            'is_active' => true,
        ]);
    }

    private function makeItem(Restaurant $r): MenuItem
    {
        return MenuItem::create([
            'restaurant_id' => $r->id,
            'name' => 'Jollof',
            'price' => 25,
            'category' => 'mains',
            'is_available' => true,
        ]);
    }

    public function test_immediate_order_still_works_without_schedule(): void
    {
        $this->actingAsUser();
        $r = $this->makeRestaurant();
        $item = $this->makeItem($r);

        $res = $this->postJson('/api/food/orders', [
            'restaurant_id' => $r->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
            'delivery_address' => 'My House',
        ]);

        $res->assertCreated();
        $this->assertNull($res->json('data.scheduled_for'));
    }

    public function test_scheduled_order_persists_the_slot(): void
    {
        $this->actingAsUser();
        $r = $this->makeRestaurant();
        $item = $this->makeItem($r);
        $when = now()->addDay()->setTime(18, 30);

        $res = $this->postJson('/api/food/orders', [
            'restaurant_id' => $r->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
            'delivery_address' => 'My House',
            'scheduled_for' => $when->toIso8601String(),
        ]);

        $res->assertCreated();
        $this->assertNotNull($res->json('data.scheduled_for'));
    }

    public function test_past_schedule_is_rejected(): void
    {
        $this->actingAsUser();
        $r = $this->makeRestaurant();
        $item = $this->makeItem($r);

        $this->postJson('/api/food/orders', [
            'restaurant_id' => $r->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
            'delivery_address' => 'My House',
            'scheduled_for' => now()->subHour()->toIso8601String(),
        ])->assertStatus(422)->assertJsonValidationErrors(['scheduled_for']);
    }

    public function test_schedule_beyond_seven_days_is_rejected(): void
    {
        $this->actingAsUser();
        $r = $this->makeRestaurant();
        $item = $this->makeItem($r);

        $this->postJson('/api/food/orders', [
            'restaurant_id' => $r->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
            'delivery_address' => 'My House',
            'scheduled_for' => now()->addDays(8)->toIso8601String(),
        ])->assertStatus(422)->assertJsonValidationErrors(['scheduled_for']);
    }
}
