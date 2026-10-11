<?php

namespace Tests\Feature\Delivery;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Delivery\Entities\Delivery;
use Modules\Delivery\Entities\DeliveryManager;
use Modules\Orders\Entities\Order;
use Tests\TestCase;

/**
 * Plan G2: order <-> rider assignment ledger.
 *
 * Admins attach paid orders to (available) riders; riders advance their own
 * deliveries one strict step; strangers see nothing; customers track their
 * own order's delivery. Double assignment and status skips are rejected.
 */
class DeliveryAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private function rider(): object
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');
        $this->postJson('/api/delivery/managers', [
            'full_name' => 'Assign Rider',
            'phone' => '+233200000002',
            'vehicle_type' => 'motorbike',
        ])->assertStatus(201);

        return $user;
    }

    private function paidOrder(object $buyer): Order
    {
        return Order::create([
            'user_id' => $buyer->id,
            'order_number' => 'EN-'.strtoupper(uniqid()),
            'status' => Order::STATUS_PAID,
            'subtotal' => 75,
            'total_amount' => 75,
            'shipping_address' => '3 Test Ave',
        ]);
    }

    public function test_admin_assigns_and_rider_completes_strict_chain(): void
    {
        $rider = $this->rider();
        $manager = DeliveryManager::where('user_id', $rider->id)->firstOrFail();
        $buyer = $this->createUser();
        $order = $this->paidOrder($buyer);

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $deliveryId = $this->postJson("/api/delivery/assign/{$order->id}", [
            'manager_id' => $manager->id,
        ])->assertStatus(201)->json('data.id');

        // Duplicate assignment rejected.
        $this->postJson("/api/delivery/assign/{$order->id}")->assertStatus(422);

        // Stranger rider sees nothing and cannot touch it.
        $other = $this->createUser();
        $this->actingAs($other, 'sanctum');
        $this->getJson('/api/delivery/queue')->assertStatus(404);
        $this->postJson("/api/delivery/{$deliveryId}/transition", ['status' => 'picked_up'])
            ->assertStatus(404);

        // Owner advances one strict step at a time; skips rejected.
        $this->actingAs($rider, 'sanctum');
        $this->getJson('/api/delivery/queue')->assertOk()->assertJsonFragment(['id' => $deliveryId]);
        $this->postJson("/api/delivery/{$deliveryId}/transition", ['status' => 'in_transit'])
            ->assertStatus(422);
        $this->postJson("/api/delivery/{$deliveryId}/transition", ['status' => 'picked_up'])->assertOk();
        $this->postJson("/api/delivery/{$deliveryId}/transition", ['status' => 'in_transit'])->assertOk();
        $this->postJson("/api/delivery/{$deliveryId}/transition", ['status' => 'delivered'])->assertOk();

        $this->assertDatabaseHas('deliveries', ['id' => $deliveryId, 'status' => 'delivered']);
        $this->assertSame(1, (int) $manager->fresh()->completed_deliveries);

        // Terminal rows leave the queue and enter history.
        $this->getJson('/api/delivery/queue')->assertOk()->assertJsonMissing(['id' => $deliveryId]);
        $this->getJson('/api/delivery/history')->assertOk()->assertJsonFragment(['id' => $deliveryId]);

        // Customer tracks their own order's delivery; others get 404.
        $this->actingAs($buyer, 'sanctum');
        $this->getJson("/api/delivery/order/{$order->id}")->assertOk()->assertJsonPath('data.status', 'delivered');
        $this->actingAs($other, 'sanctum');
        $this->getJson("/api/delivery/order/{$order->id}")->assertStatus(404);
    }

    public function test_assign_gates_and_unpaid_orders_rejected(): void
    {
        $rider = $this->rider();
        $buyer = $this->createUser();
        $order = $this->paidOrder($buyer);

        // Non-admin cannot assign.
        $this->actingAs($rider, 'sanctum');
        $this->postJson("/api/delivery/assign/{$order->id}")->assertStatus(403);

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        // Unpaid orders cannot enter the ledger.
        $order->update(['status' => Order::STATUS_PENDING]);
        $this->postJson("/api/delivery/assign/{$order->id}")->assertStatus(422);

        $this->assertDatabaseMissing('deliveries', ['order_id' => $order->id]);
    }
}
