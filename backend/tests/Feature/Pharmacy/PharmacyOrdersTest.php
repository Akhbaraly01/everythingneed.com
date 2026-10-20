<?php

namespace Tests\Feature\Pharmacy;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Pharmacy\Entities\Medicine;
use Tests\TestCase;

class PharmacyOrdersTest extends TestCase
{
    use RefreshDatabase;

    private function makeMedicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'name' => fake()->words(3, true),
            'category' => 'painkillers',
            'price' => fake()->randomFloat(2, 5, 100),
            'stock_quantity' => 100,
        ], $overrides));
    }

    public function test_guests_cannot_use_pharmacy_orders(): void
    {
        $this->getJson('/api/pharmacy/orders')->assertUnauthorized();
        $this->getJson('/api/pharmacy/orders/'.str_repeat('a', 36))->assertUnauthorized();
        $this->postJson('/api/pharmacy/orders', [])->assertUnauthorized();
    }

    public function test_orders_list_is_scoped_to_owner(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $mine = MedicineOrder::create([
            'user_id' => $me->id,
            'order_number' => 'MED-MINE001',
            'delivery_address' => 'My address',
            'total_amount' => 10,
            'status' => 'pending',
        ]);
        MedicineOrder::create([
            'user_id' => $other->id,
            'order_number' => 'MED-OTHER01',
            'delivery_address' => 'Other address',
            'total_amount' => 99,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($me, 'sanctum')
            ->getJson('/api/pharmacy/orders')
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertCount(1, $ids);
        $this->assertTrue($ids->contains($mine->id));
    }

    public function test_order_detail_is_owned_else_404(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $mine = MedicineOrder::create([
            'user_id' => $me->id,
            'order_number' => 'MED-MINE002',
            'delivery_address' => 'My address',
            'total_amount' => 10,
            'status' => 'pending',
        ]);
        $theirs = MedicineOrder::create([
            'user_id' => $other->id,
            'order_number' => 'MED-OTHER02',
            'delivery_address' => 'Other address',
            'total_amount' => 50,
            'status' => 'pending',
        ]);

        $this->actingAs($me, 'sanctum')
            ->getJson("/api/pharmacy/orders/{$mine->id}")
            ->assertOk()
            ->assertJsonPath('data.order_number', 'MED-MINE002');

        $this->actingAs($me, 'sanctum')
            ->getJson("/api/pharmacy/orders/{$theirs->id}")
            ->assertNotFound();

        $this->getJson('/api/pharmacy/orders/'.str_repeat('b', 36))
            ->assertNotFound();
    }

    public function test_create_order_computes_total_and_persists_lines(): void
    {
        $user = User::factory()->create();
        $paracetamol = $this->makeMedicine(['price' => 3.50]);
        $ibuprofen = $this->makeMedicine(['price' => 5.25]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/pharmacy/orders', [
                'items' => [
                    ['medicine_id' => $paracetamol->id, 'quantity' => 2],
                    ['medicine_id' => $ibuprofen->id, 'quantity' => 1],
                ],
                'delivery_address' => '12 Healing St',
            ])
            ->assertStatus(201);

        $orderId = $response->json('data.id');
        $this->assertEquals('12 Healing St', $response->json('data.delivery_address'));
        $this->assertEquals('pending', $response->json('data.status'));
        $this->assertStringStartsWith('MED-', $response->json('data.order_number'));

        // 2 × 3.50 + 1 × 5.25 = 12.25 (server-computed, never client-trusted)
        $this->assertEquals(12.25, (float) $response->json('data.total_amount'));

        $this->assertDatabaseHas('medicine_order_items', [
            'order_id' => $orderId,
            'medicine_id' => $paracetamol->id,
            'quantity' => 2,
            'unit_price' => 3.50,
        ]);
        $this->assertDatabaseHas('medicine_order_items', [
            'order_id' => $orderId,
            'medicine_id' => $ibuprofen->id,
            'quantity' => 1,
            'unit_price' => 5.25,
        ]);
        $this->assertEquals($user->id, MedicineOrder::find($orderId)->user_id);
    }

    public function test_create_order_404_for_unknown_medicine(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/pharmacy/orders', [
                'items' => [['medicine_id' => 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'quantity' => 1]],
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('medicine_orders', 0);
    }

    public function test_create_order_validates_payload(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/pharmacy/orders', ['items' => []])
            ->assertStatus(422);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/pharmacy/orders', [
                'items' => [['medicine_id' => 'not-a-uuid', 'quantity' => 1]],
            ])
            ->assertStatus(422);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/pharmacy/orders', [
                'items' => [['medicine_id' => str_repeat('c', 36), 'quantity' => 0]],
            ])
            ->assertStatus(422);

        $this->assertDatabaseCount('medicine_orders', 0);
    }

    public function test_total_ignores_requested_amount_field(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['price' => 10.00]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/pharmacy/orders', [
                'items' => [['medicine_id' => $medicine->id, 'quantity' => 3]],
                'total_amount' => 0.01,
            ])
            ->assertStatus(201);

        $this->assertEquals(30.00, (float) $response->json('data.total_amount'));
    }

    public function test_guests_cannot_cancel_orders(): void
    {
        $this->postJson('/api/pharmacy/orders/'.str_repeat('a', 36).'/cancel')->assertUnauthorized();
    }

    public function test_customer_cancels_pending_order_and_stock_is_restocked(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock_quantity' => 10]);

        $order = $this->actingAs($user, 'sanctum')
            ->postJson('/api/pharmacy/orders', [
                'items' => [['medicine_id' => $medicine->id, 'quantity' => 4]],
            ])
            ->assertStatus(201)
            ->json('data.id');

        $this->assertEquals(6, $medicine->fresh()->stock_quantity);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/pharmacy/orders/{$order}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', MedicineOrder::STATUS_CANCELLED);

        $this->assertEquals(10, $medicine->fresh()->stock_quantity);
    }

    public function test_customer_cannot_cancel_a_confirmed_order(): void
    {
        $user = User::factory()->create();
        $order = MedicineOrder::create([
            'user_id' => $user->id,
            'order_number' => 'MED-CONF001',
            'delivery_address' => 'Addr',
            'total_amount' => 5,
            'status' => MedicineOrder::STATUS_CONFIRMED,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/pharmacy/orders/{$order->id}/cancel")
            ->assertStatus(422);

        $this->assertEquals(MedicineOrder::STATUS_CONFIRMED, $order->fresh()->status);
    }

    public function test_cannot_cancel_a_strangers_order(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $theirs = MedicineOrder::create([
            'user_id' => $other->id,
            'order_number' => 'MED-STR001',
            'delivery_address' => 'Addr',
            'total_amount' => 5,
            'status' => MedicineOrder::STATUS_PENDING,
        ]);

        $this->actingAs($me, 'sanctum')
            ->postJson("/api/pharmacy/orders/{$theirs->id}/cancel")
            ->assertNotFound();

        $this->assertEquals(MedicineOrder::STATUS_PENDING, $theirs->fresh()->status);
    }
}
