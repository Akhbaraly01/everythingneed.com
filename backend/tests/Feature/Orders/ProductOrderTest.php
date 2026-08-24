<?php

namespace Tests\Feature\Orders;

use Tests\TestCase;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Modules\Orders\Entities\Order;

class ProductOrderTest extends TestCase
{
    private function makeVendorProduct(float $price = 25.0, int $stock = 10): array
    {
        $vendorUser = $this->createVendorUser();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => fake()->company(),
            'category' => 'electronics',
            'is_verified' => true,
        ]);

        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Mechanical Keyboard',
            'description' => 'Test product',
            'category' => 'electronics',
            'price' => $price,
            'stock_quantity' => $stock,
            'is_active' => true,
        ]);

        return [$vendorUser, $vendor, $product];
    }

    private function placePayload(Product $product, int $qty = 2): array
    {
        return [
            'items' => [['product_id' => $product->id, 'quantity' => $qty]],
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Springfield',
            'phone' => '+1-555-0100',
        ];
    }

    public function test_customer_can_place_a_product_order(): void
    {
        [, , $product] = $this->makeVendorProduct(price: 30.00, stock: 5);
        $customer = $this->actingAsUser();

        $response = $this->postJson('/api/product-orders', $this->placePayload($product, 2));

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'data' => ['id', 'order_number', 'total_amount', 'status']]);

        $order = Order::find($response->json('data.id'));
        $this->assertEquals('pending', $order->status);
        $this->assertEquals(60.00, (float) $order->total_amount);
        $this->assertCount(1, $order->items);

        // Server-side pricing won regardless of client input
        $this->assertEquals(30.00, (float) $order->items->first()->unit_price);

        // Stock decremented
        $this->assertEquals(3, $product->fresh()->stock_quantity);
    }

    public function test_order_rejects_insufficient_stock(): void
    {
        [, , $product] = $this->makeVendorProduct(stock: 1);
        $this->actingAsUser();

        $response = $this->postJson('/api/product-orders', $this->placePayload($product, 5));

        $response->assertStatus(422);
        $this->assertEquals(1, $product->fresh()->stock_quantity);
    }

    public function test_customer_can_pay_for_their_pending_order(): void
    {
        [, , $product] = $this->makeVendorProduct();
        $customer = $this->actingAsUser();

        $placed = $this->postJson('/api/product-orders', $this->placePayload($product));
        $orderId = $placed->json('data.id');
        $total = $placed->json('data.total_amount');

        $payResponse = $this->postJson('/api/payments/charge', [
            'order_id' => $orderId,
            'amount' => $total,
            'method' => 'card',
        ]);

        $payResponse->assertStatus(201)
            ->assertJsonFragment(['message' => 'Payment charged successfully']);

        $this->assertEquals('paid', Order::find($orderId)->status);

        // Wrong amount is rejected on a real order
        $second = $this->postJson('/api/product-orders', $this->placePayload($product))->json('data.id');
        $badPay = $this->postJson('/api/payments/charge', [
            'order_id' => $second,
            'amount' => 0.01,
            'method' => 'card',
        ]);
        $badPay->assertStatus(422);
    }

    public function test_vendor_fulfilment_lifecycle_updates_parent_and_tracking(): void
    {
        [$vendorUser, , $product] = $this->makeVendorProduct();
        $customer = $this->actingAsUser();

        $orderId = $this->postJson('/api/product-orders', $this->placePayload($product))
            ->json('data.id');

        // Customer pays
        $total = Order::find($orderId)->total_amount;
        $this->postJson('/api/payments/charge', [
            'order_id' => $orderId,
            'amount' => (float) $total,
            'method' => 'card',
        ])->assertStatus(201);

        // Vendor accepts → ships → delivers
        $this->actingAs($vendorUser, 'sanctum');

        $vendorOrderId = $this->getJson('/api/vendor/orders')
            ->assertOk()
            ->json('data.0.id');

        $this->postJson("/api/vendor/orders/{$vendorOrderId}/accept")->assertOk();
        $this->assertEquals('processing', Order::find($orderId)->status);

        $this->postJson("/api/vendor/orders/{$vendorOrderId}/ship")->assertOk();
        $this->assertEquals('shipped', Order::find($orderId)->status);

        $this->postJson("/api/vendor/orders/{$vendorOrderId}/deliver")->assertOk();
        $this->assertEquals('delivered', Order::find($orderId)->status);

        // Tracking timeline recorded every step
        $tracking = $this->getJson("/api/product-orders/{$orderId}/tracking")
            ->assertOk()
            ->json('data');

        $statuses = array_column($tracking, 'status');
        $this->assertEquals(['pending', 'paid', 'processing', 'shipped', 'delivered'], $statuses);
    }

    public function test_other_vendor_cannot_transition_someone_elses_sub_order(): void
    {
        [, , $product] = $this->makeVendorProduct();
        $customer = $this->actingAsUser();

        $orderId = $this->postJson('/api/product-orders', $this->placePayload($product))->json('data.id');
        $total = Order::find($orderId)->total_amount;
        $this->postJson('/api/payments/charge', [
            'order_id' => $orderId,
            'amount' => (float) $total,
            'method' => 'card',
        ])->assertStatus(201);

        $otherVendorUser = $this->createVendorUser();
        Vendor::create([
            'user_id' => $otherVendorUser->id,
            'store_name' => 'Other Shop',
            'category' => 'general',
            'is_verified' => true,
        ]);
        $this->actingAs($otherVendorUser, 'sanctum');

        $vendorOrderId = \Modules\Orders\Entities\VendorOrder::where('order_id', $orderId)->value('id');

        $this->postJson("/api/vendor/orders/{$vendorOrderId}/accept")
            ->assertStatus(404);
    }

    public function test_cancellation_restores_stock(): void
    {
        [, , $product] = $this->makeVendorProduct(stock: 4);
        $customer = $this->actingAsUser();

        $orderId = $this->postJson('/api/product-orders', $this->placePayload($product, 3))
            ->json('data.id');

        $this->assertEquals(1, $product->fresh()->stock_quantity);

        $this->postJson("/api/product-orders/{$orderId}/cancel")
            ->assertOk()
            ->assertJsonFragment(['message' => 'Order cancelled successfully']);

        $this->assertEquals(4, $product->fresh()->stock_quantity);
        $this->assertEquals('cancelled', Order::find($orderId)->status);
    }

    public function test_customer_cannot_view_another_customers_product_order(): void
    {
        [, , $product] = $this->makeVendorProduct();
        $owner = $this->actingAsUser();

        $orderId = $this->postJson('/api/product-orders', $this->placePayload($product))->json('data.id');

        $intruder = $this->actingAsUser();
        $this->getJson("/api/product-orders/{$orderId}")
            ->assertStatus(403);
    }
}
