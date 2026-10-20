<?php

namespace Tests\Feature\Food;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Food\Entities\FoodOrder;
use Modules\Food\Entities\Restaurant;
use Tests\TestCase;

class FoodOrderLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrder(string $status, ?string $userId = null): FoodOrder
    {
        $r = Restaurant::create([
            'name' => 'Lifecycle Bites',
            'cuisine_type' => 'local',
            'address' => '2 Food St',
            'city' => 'Accra',
            'is_active' => true,
            'rating' => 4.0,
        ]);

        return FoodOrder::create([
            'user_id' => $userId ?? $this->createUser()->id,
            'restaurant_id' => $r->id,
            'order_number' => 'FO-'.strtoupper(Str::random(6)),
            'delivery_address' => 'Addr',
            'total_amount' => 10,
            'status' => $status,
        ]);
    }

    public function test_customer_cancels_own_pending_order(): void
    {
        $me = $this->actingAsUser();
        $order = $this->makeOrder(FoodOrder::STATUS_PENDING, $me->id);

        $this->postJson("/api/food/orders/{$order->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', FoodOrder::STATUS_CANCELLED);
    }

    public function test_customer_cannot_cancel_confirmed_order(): void
    {
        $me = $this->actingAsUser();
        $order = $this->makeOrder(FoodOrder::STATUS_CONFIRMED, $me->id);

        $this->postJson("/api/food/orders/{$order->id}/cancel")->assertStatus(422);
        $this->assertEquals(FoodOrder::STATUS_CONFIRMED, $order->fresh()->status);
    }

    public function test_cannot_cancel_strangers_order(): void
    {
        $me = $this->actingAsUser();
        $order = $this->makeOrder(FoodOrder::STATUS_PENDING);

        $this->postJson("/api/food/orders/{$order->id}/cancel")->assertNotFound();
        $this->assertEquals(FoodOrder::STATUS_PENDING, $order->fresh()->status);
    }

    public function test_admin_walks_the_full_fulfillment_lifecycle(): void
    {
        $this->actingAsAdmin();
        $order = $this->makeOrder(FoodOrder::STATUS_PENDING);
        $id = $order->id;

        foreach ([
            ['confirm', FoodOrder::STATUS_CONFIRMED],
            ['prepare', FoodOrder::STATUS_PREPARING],
            ['out', FoodOrder::STATUS_OUT_FOR_DELIVERY],
            ['deliver', FoodOrder::STATUS_DELIVERED],
        ] as [$action, $expected]) {
            $this->postJson("/api/admin/food/orders/{$id}/transition", ['action' => $action])
                ->assertOk()
                ->assertJsonPath('data.status', $expected);
        }
    }

    public function test_admin_can_cancel_pending_or_confirmed_but_not_preparing(): void
    {
        $this->actingAsAdmin();

        $pending = $this->makeOrder(FoodOrder::STATUS_PENDING);
        $this->postJson("/api/admin/food/orders/{$pending->id}/transition", ['action' => 'cancel'])
            ->assertOk()
            ->assertJsonPath('data.status', FoodOrder::STATUS_CANCELLED);

        $preparing = $this->makeOrder(FoodOrder::STATUS_PREPARING);
        $this->postJson("/api/admin/food/orders/{$preparing->id}/transition", ['action' => 'cancel'])
            ->assertStatus(422);
    }

    public function test_illegal_transitions_are_rejected(): void
    {
        $this->actingAsAdmin();
        $order = $this->makeOrder(FoodOrder::STATUS_PENDING);

        // Cannot deliver straight from pending.
        $this->postJson("/api/admin/food/orders/{$order->id}/transition", ['action' => 'deliver'])
            ->assertStatus(422);
        $this->assertEquals(FoodOrder::STATUS_PENDING, $order->fresh()->status);

        // Bogus action is a validation error.
        $this->postJson("/api/admin/food/orders/{$order->id}/transition", ['action' => 'teleport'])
            ->assertStatus(422);
    }

    public function test_guests_cannot_cancel_or_transition(): void
    {
        $order = $this->makeOrder(FoodOrder::STATUS_PENDING);

        $this->postJson("/api/food/orders/{$order->id}/cancel")->assertUnauthorized();
        $this->postJson("/api/admin/food/orders/{$order->id}/transition", ['action' => 'confirm'])
            ->assertUnauthorized();
    }
}
