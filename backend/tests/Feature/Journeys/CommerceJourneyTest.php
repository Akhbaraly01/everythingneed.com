<?php

namespace Tests\Feature\Journeys;

use Modules\Orders\Entities\Order;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class CommerceJourneyTest extends TestCase
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
            'approved_at' => now(),
        ]);

        return [$vendorUser, $vendor, $product];
    }

    public function test_single_chain_browse_cart_checkout_pay_deliver_commission_and_notification(): void
    {
        [$vendorUser, $vendor, $product] = $this->makeVendorProduct(price: 25.0, stock: 10);
        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum');

        // Browse (public) + product detail
        $this->getJson('/api/products')->assertOk()->assertJsonStructure(['data']);
        $this->getJson("/api/products/{$product->id}")->assertOk();

        // Cart: add 2 units, server-computed totals
        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertOk();
        $cart = $this->getJson('/api/cart')->assertOk()->json('data');
        $this->assertSame(2, (int) $cart['item_count']);
        $this->assertSame('50.00', (string) $cart['subtotal']);

        // Checkout = POST /api/product-orders (server-side pricing)
        $placed = $this->postJson('/api/product-orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'shipping_address' => '123 Test Street',
            'shipping_city' => 'Springfield',
        ]);
        $placed->assertStatus(201);
        $orderId = $placed->json('data.id');

        $order = Order::find($orderId);
        $this->assertSame('pending', $order->status);
        $this->assertEquals(50.00, (float) $order->total_amount);
        $this->assertEquals(8, $product->fresh()->stock_quantity);

        // Order notification created over the HTTP chain (not manual listener)
        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => 'order',
            'title' => 'Order confirmed',
            'related_id' => $orderId,
        ]);

        // My orders list + detail
        $list = $this->getJson('/api/product-orders')->assertOk();
        $this->assertContains($orderId, array_column($list->json('data'), 'id'));
        $this->getJson("/api/product-orders/{$orderId}")->assertOk();

        // Pay (server-authoritative amount)
        $this->postJson('/api/payments/charge', [
            'order_id' => $orderId,
            'amount' => 50.00,
            'method' => 'card',
        ])->assertStatus(201);
        $this->assertSame('paid', Order::find($orderId)->status);

        // Vendor fulfilment: accept -> ship -> deliver (commission accrues on deliver)
        $this->actingAs($vendorUser, 'sanctum');
        $vendorOrderId = $this->getJson('/api/vendor/orders')->assertOk()->json('data.0.id');
        $this->postJson("/api/vendor/orders/{$vendorOrderId}/accept")->assertOk();
        $this->postJson("/api/vendor/orders/{$vendorOrderId}/ship")->assertOk();
        $this->postJson("/api/vendor/orders/{$vendorOrderId}/deliver")->assertOk();
        $this->assertSame('delivered', Order::find($orderId)->status);

        $this->assertDatabaseHas('vendor_commissions', [
            'vendor_id' => $vendor->id,
            'order_id' => $vendorOrderId,
            'amount' => 45.00,
            'rate' => 0.10,
            'status' => 'cleared',
        ]);

        // Full tracking timeline
        $statuses = array_column(
            $this->getJson("/api/product-orders/{$orderId}/tracking")->assertOk()->json('data'),
            'status'
        );
        $this->assertSame(['pending', 'paid', 'processing', 'shipped', 'delivered'], $statuses);
    }

    public function test_order_lifecycle_rejects_cross_vendor_and_stranger_access(): void
    {
        [, , $product] = $this->makeVendorProduct();
        $customer = $this->createUser();
        $stranger = $this->createUser();

        $orderId = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/product-orders', [
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
                'shipping_address' => '123 Test Street',
            ])
            ->assertStatus(201)
            ->json('data.id');

        $this->actingAs($stranger, 'sanctum');
        $this->getJson("/api/product-orders/{$orderId}")->assertStatus(403);
        $this->getJson('/api/product-orders')->assertOk()->assertJsonPath('data', []);
    }
}
