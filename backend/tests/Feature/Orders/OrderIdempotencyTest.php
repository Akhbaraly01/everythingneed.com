<?php

namespace Tests\Feature\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Entities\Order;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * Plan loop (phase 11): duplicate-checkout protection.
 *
 * Two submissions carrying the same idempotency key produce exactly one
 * order (same id), decrement stock once, and never double-charge stock -
 * sequential replays return the original, and the unique index makes
 * concurrent races collapse to the winner.
 */
class OrderIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    private function product(int $stock = 5): Product
    {
        $vendorUser = $this->createVendorUser();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => fake()->company(),
            'category' => 'electronics',
            'is_verified' => true,
        ]);

        return Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Idempotency Fixture',
            'description' => 'Fixture',
            'category' => 'electronics',
            'price' => 20,
            'stock_quantity' => $stock,
            'is_active' => true,
        ]);
    }

    public function test_repeated_submission_with_same_key_returns_original_order(): void
    {
        $product = $this->product(5);
        $customer = $this->actingAsUser();

        $payload = [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'shipping_address' => '1 Test St',
            'idempotency_key' => 'web-'.uniqid(),
        ];

        $first = $this->postJson('/api/product-orders', $payload)->assertStatus(201);
        $second = $this->postJson('/api/product-orders', $payload)->assertStatus(201);

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, Order::where('user_id', $customer->id)->count());
        // Stock moved exactly once (5 - 2), not twice.
        $this->assertSame(3, (int) $product->fresh()->stock_quantity);
    }

    public function test_different_keys_create_different_orders(): void
    {
        $product = $this->product(10);
        $customer = $this->actingAsUser();

        $base = [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'shipping_address' => '1 Test St',
        ];

        $first = $this->postJson('/api/product-orders', $base + ['idempotency_key' => 'k-1'])
            ->assertStatus(201);
        $second = $this->postJson('/api/product-orders', $base + ['idempotency_key' => 'k-2'])
            ->assertStatus(201);

        $this->assertNotSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(2, Order::where('user_id', $customer->id)->count());
    }

    public function test_orders_without_key_behave_as_before(): void
    {
        $product = $this->product(10);
        $customer = $this->actingAsUser();

        $payload = [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'shipping_address' => '1 Test St',
        ];

        $this->postJson('/api/product-orders', $payload)->assertStatus(201);
        $this->assertSame(1, Order::where('user_id', $customer->id)->count());
    }
}
