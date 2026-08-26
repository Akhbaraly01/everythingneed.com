<?php

namespace Tests\Feature\Orders;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Entities\Order;
use Modules\Orders\Entities\OrderItem;
use Modules\Orders\Entities\ReturnRequest;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class ReturnRequestTest extends TestCase
{
    use RefreshDatabase;

    private function createDeliveredOrder(User $user): Order
    {
        $vendor = Vendor::create(['user_id' => $user->id, 'store_name' => 'V', 'category' => 'general']);
        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Widget',
            'category' => 'general',
            'price' => 50.00,
            'stock_quantity' => 100,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'order_number' => 'EN-RET001',
            'status' => 'delivered',
            'subtotal' => 50.00,
            'total_amount' => 50.00,
            'currency' => 'USD',
            'shipping_address' => '123 Test St',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'vendor_id' => $vendor->id,
            'product_name' => 'Widget',
            'quantity' => 1,
            'unit_price' => 50.00,
            'total_price' => 50.00,
        ]);

        return $order;
    }

    public function test_customer_can_create_return_request(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $order = $this->createDeliveredOrder($user);
        $this->actingAs($user, 'sanctum');

        $res = $this->postJson('/api/returns', [
            'order_id' => $order->id,
            'reason' => 'Item damaged',
            'description' => 'Arrived broken',
        ]);

        $res->assertStatus(201)->assertJsonStructure(['data' => ['id', 'status']]);
        $this->assertDatabaseHas('return_requests', ['order_id' => $order->id, 'status' => 'pending']);
    }

    public function test_cannot_return_pending_order(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $vendor = Vendor::create(['user_id' => $user->id, 'store_name' => 'V', 'category' => 'general']);
        $product = Product::create([
            'vendor_id' => $vendor->id, 'name' => 'X', 'category' => 'general',
            'price' => 10.00, 'stock_quantity' => 5, 'is_active' => true, 'approved_at' => now(),
        ]);
        $order = Order::create([
            'user_id' => $user->id, 'order_number' => 'EN-PEND', 'status' => 'pending',
            'subtotal' => 10.00, 'total_amount' => 10.00, 'currency' => 'USD', 'shipping_address' => '123',
        ]);
        $this->actingAs($user, 'sanctum');

        $res = $this->postJson('/api/returns', [
            'order_id' => $order->id,
            'reason' => 'Changed mind',
        ]);

        $res->assertStatus(422);
    }

    public function test_duplicate_pending_return_is_rejected(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $order = $this->createDeliveredOrder($user);
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/returns', [
            'order_id' => $order->id,
            'reason' => 'First return',
        ])->assertStatus(201);

        $res = $this->postJson('/api/returns', [
            'order_id' => $order->id,
            'reason' => 'Second return',
        ]);

        $res->assertStatus(422);
    }

    public function test_customer_can_list_returns(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $order = $this->createDeliveredOrder($user);
        $this->actingAs($user, 'sanctum');

        ReturnRequest::create([
            'order_id' => $order->id,
            'user_id' => $user->id,
            'reason' => 'Defective',
            'status' => 'pending',
        ]);

        $res = $this->getJson('/api/returns');

        $res->assertOk()->assertJsonCount(1, 'data');
    }
}
