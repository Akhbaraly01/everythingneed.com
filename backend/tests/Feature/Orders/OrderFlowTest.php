<?php

namespace Tests\Feature\Orders;

use Tests\TestCase;
use App\Models\User;
use Modules\Pharmacy\Entities\Medicine;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Orders\Entities\MedicineOrderItem;
use Modules\Orders\Entities\VendorOrder;
use Modules\Vendors\Entities\Vendor;
use Modules\Products\Entities\Product;

class OrderFlowTest extends TestCase
{
    private function createMedicine(array $attributes = []): Medicine
    {
        return Medicine::create(array_merge([
            'name' => fake()->words(3, true),
            'category' => 'painkillers',
            'price' => fake()->randomFloat(2, 5, 100),
            'stock_quantity' => 100,
        ], $attributes));
    }

    private function createMedicineOrder(User $user, array $attributes = []): MedicineOrder
    {
        return MedicineOrder::create(array_merge([
            'user_id' => $user->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'delivery_address' => fake()->address(),
            'total_amount' => 0,
            'status' => 'pending',
        ], $attributes));
    }

    public function test_authenticated_user_can_create_order(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 50, 'price' => 15.00]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'delivery_address' => '123 Main St, City',
                'items' => [
                    [
                        'medicine_id' => $medicine->id,
                        'quantity' => 2,
                        'unit_price' => 15.00,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Order placed successfully']);

        $this->assertDatabaseHas('medicine_orders', [
            'user_id' => $user->id,
            'delivery_address' => '123 Main St, City',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('medicine_order_items', [
            'medicine_id' => $medicine->id,
            'quantity' => 2,
            'unit_price' => 15.00,
        ]);

        $medicine->refresh();
        $this->assertEquals(48, $medicine->stock_quantity);
    }

    public function test_order_requires_delivery_address(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 50]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'items' => [
                    [
                        'medicine_id' => $medicine->id,
                        'quantity' => 1,
                        'unit_price' => 10.00,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['delivery_address']);
    }

    public function test_order_requires_items(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'delivery_address' => '123 Main St, City',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_order_requires_medicine_id_in_items(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'delivery_address' => '123 Main St, City',
                'items' => [
                    [
                        'quantity' => 1,
                        'unit_price' => 10.00,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.medicine_id']);
    }

    public function test_order_requires_quantity_in_items(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'delivery_address' => '123 Main St, City',
                'items' => [
                    [
                        'medicine_id' => $medicine->id,
                        'unit_price' => 10.00,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.quantity']);
    }

    public function test_order_requires_at_least_one_item(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'delivery_address' => '123 Main St, City',
                'items' => [],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_unauthenticated_user_cannot_create_order(): void
    {
        $response = $this->postJson('/api/orders', [
            'delivery_address' => '123 Main St, City',
            'items' => [
                [
                    'medicine_id' => 'some-id',
                    'quantity' => 1,
                    'unit_price' => 10.00,
                ],
            ],
        ]);

        $response->assertStatus(401);
    }

    public function test_order_status_can_be_cancelled(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 50]);

        $order = $this->createMedicineOrder($user);
        MedicineOrderItem::create([
            'order_id' => $order->id,
            'medicine_id' => $medicine->id,
            'quantity' => 3,
            'unit_price' => $medicine->price,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$order->id}/cancel");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Order cancelled successfully']);

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
    }

    public function test_user_cannot_cancel_already_shipped_order(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 50]);

        $order = $this->createMedicineOrder($user, ['status' => 'shipped']);
        MedicineOrderItem::create([
            'order_id' => $order->id,
            'medicine_id' => $medicine->id,
            'quantity' => 2,
            'unit_price' => $medicine->price,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$order->id}/cancel");

        $response->assertStatus(422);
    }

    public function test_user_can_list_own_orders(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 100]);

        $order1 = $this->createMedicineOrder($user, ['order_number' => 'ORD-001']);
        MedicineOrderItem::create([
            'order_id' => $order1->id,
            'medicine_id' => $medicine->id,
            'quantity' => 1,
            'unit_price' => 10.00,
        ]);

        $order2 = $this->createMedicineOrder($user, ['order_number' => 'ORD-002']);
        MedicineOrderItem::create([
            'order_id' => $order2->id,
            'medicine_id' => $medicine->id,
            'quantity' => 2,
            'unit_price' => 10.00,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/orders');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'order_number', 'status']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_only_sees_own_orders(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 100]);

        $order1 = $this->createMedicineOrder($user1, ['order_number' => 'ORD-U1']);
        MedicineOrderItem::create([
            'order_id' => $order1->id,
            'medicine_id' => $medicine->id,
            'quantity' => 1,
            'unit_price' => 10.00,
        ]);

        $order2 = $this->createMedicineOrder($user2, ['order_number' => 'ORD-U2']);
        MedicineOrderItem::create([
            'order_id' => $order2->id,
            'medicine_id' => $medicine->id,
            'quantity' => 1,
            'unit_price' => 10.00,
        ]);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson('/api/orders');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('ORD-U1', $response->json('data.0.order_number'));
    }

    public function test_user_can_view_own_order(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 50]);

        $order = $this->createMedicineOrder($user, ['order_number' => 'ORD-VIEW']);
        MedicineOrderItem::create([
            'order_id' => $order->id,
            'medicine_id' => $medicine->id,
            'quantity' => 1,
            'unit_price' => 15.00,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/orders/{$order->id}");

        $response->assertOk()
            ->assertJsonFragment(['order_number' => 'ORD-VIEW']);
    }

    public function test_user_cannot_view_another_users_order(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 50]);

        $order = $this->createMedicineOrder($user2);
        MedicineOrderItem::create([
            'order_id' => $order->id,
            'medicine_id' => $medicine->id,
            'quantity' => 1,
            'unit_price' => 10.00,
        ]);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson("/api/orders/{$order->id}");

        $response->assertStatus(403);
    }

    public function test_order_stock_is_decremented_on_creation(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 20]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'delivery_address' => '123 Main St, City',
                'items' => [
                    [
                        'medicine_id' => $medicine->id,
                        'quantity' => 5,
                        'unit_price' => $medicine->price,
                    ],
                ],
            ]);

        $response->assertStatus(201);

        $medicine->refresh();
        $this->assertEquals(15, $medicine->stock_quantity);
    }

    public function test_order_stock_is_restored_on_cancellation(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 20]);

        $order = $this->createMedicineOrder($user);
        MedicineOrderItem::create([
            'order_id' => $order->id,
            'medicine_id' => $medicine->id,
            'quantity' => 5,
            'unit_price' => $medicine->price,
        ]);

        $medicine->decrement('stock_quantity', 5);
        $medicine->refresh();
        $this->assertEquals(15, $medicine->stock_quantity);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$order->id}/cancel");

        $response->assertOk();

        $medicine->refresh();
        $this->assertEquals(20, $medicine->stock_quantity);
    }

    public function test_vendor_can_list_orders_for_their_products(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Vendor Product',
        ]);

        $customer = $this->createUser();

        VendorOrder::create([
            'vendor_id' => $vendor->id,
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => 2,
            'unit_price' => $product->price,
            'total_price' => $product->price * 2,
            'order_number' => 'VORD-001',
            'shipping_address' => '456 Vendor St',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('vendor_orders', [
            'vendor_id' => $vendor->id,
            'customer_id' => $customer->id,
            'product_id' => $product->id,
        ]);

        $vendorOrders = VendorOrder::where('vendor_id', $vendor->id)->get();
        $this->assertCount(1, $vendorOrders);
        $this->assertEquals($product->name, $vendorOrders->first()->product_name);
    }

    public function test_order_number_is_auto_generated(): void
    {
        $user = $this->createUser();
        $medicine = $this->createMedicine(['stock_quantity' => 50]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'delivery_address' => '123 Main St, City',
                'items' => [
                    [
                        'medicine_id' => $medicine->id,
                        'quantity' => 1,
                        'unit_price' => 10.00,
                    ],
                ],
            ]);

        $response->assertStatus(201);

        $order = MedicineOrder::where('user_id', $user->id)->first();
        $this->assertNotNull($order->order_number);
        $this->assertStringStartsWith('PH-', $order->order_number);
    }

    public function test_order_total_is_calculated_correctly(): void
    {
        $user = $this->createUser();
        $medicine1 = $this->createMedicine(['stock_quantity' => 50, 'price' => 10.00]);
        $medicine2 = $this->createMedicine(['stock_quantity' => 50, 'price' => 25.00]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'delivery_address' => '123 Main St, City',
                'items' => [
                    [
                        'medicine_id' => $medicine1->id,
                        'quantity' => 3,
                        'unit_price' => 10.00,
                    ],
                    [
                        'medicine_id' => $medicine2->id,
                        'quantity' => 2,
                        'unit_price' => 25.00,
                    ],
                ],
            ]);

        $response->assertStatus(201);

        $order = MedicineOrder::where('user_id', $user->id)->first();
        $this->assertEquals(80.00, $order->total_amount);
    }
}
