<?php

namespace Tests\Feature\Reviews;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Entities\Order;
use Modules\Orders\Entities\OrderItem;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * Master-plan phase 22: the verified-purchase badge is computed
 * server-side. Delivered-order buyers get it, strangers don't, and a
 * client-supplied flag can never fake it.
 */
class VerifiedPurchaseReviewTest extends TestCase
{
    use RefreshDatabase;

    private function product(): Product
    {
        $owner = $this->createVendorUser();
        $vendor = Vendor::create([
            'user_id' => $owner->id,
            'store_name' => 'Review Vendor',
            'category' => 'general',
            'is_verified' => true,
        ]);

        return Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Review Fixture',
            'description' => 'Fixture',
            'category' => 'electronics',
            'price' => 50,
            'stock_quantity' => 10,
            'is_active' => true,
            'approved_at' => now(),
        ]);
    }

    private function orderFor(object $buyer, Product $product, string $status): void
    {
        $order = Order::create([
            'user_id' => $buyer->id,
            'order_number' => 'EN-'.strtoupper(uniqid()),
            'status' => $status,
            'subtotal' => 50,
            'total' => 50,
            'shipping_address' => '1 Test St',
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'vendor_id' => $product->vendor_id,
            'product_name' => $product->name,
            'quantity' => 1,
            'unit_price' => 50,
            'total_price' => 50,
        ]);
    }

    private function reviewPayload(Product $product, array $overrides = []): array
    {
        return array_merge([
            'reviewable_type' => 'product',
            'reviewable_id' => $product->id,
            'rating' => 5,
            'comment' => 'Solid product.',
        ], $overrides);
    }

    public function test_delivered_buyer_gets_verified_badge(): void
    {
        $product = $this->product();
        $buyer = $this->createUser();
        $this->orderFor($buyer, $product, Order::STATUS_DELIVERED);

        $this->actingAs($buyer, 'sanctum');
        $id = $this->postJson('/api/reviews', $this->reviewPayload($product))
            ->assertStatus(201)
            ->json('data.id');

        $this->assertDatabaseHas('reviews', ['id' => $id, 'is_verified_purchase' => true]);
    }

    public function test_stranger_and_pending_buyer_are_unverified(): void
    {
        $product = $this->product();

        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum');
        $id = $this->postJson('/api/reviews', $this->reviewPayload($product))
            ->assertStatus(201)
            ->json('data.id');
        $this->assertDatabaseHas('reviews', ['id' => $id, 'is_verified_purchase' => false]);

        $pending = $this->createUser();
        $this->orderFor($pending, $product, Order::STATUS_PENDING);
        $this->actingAs($pending, 'sanctum');
        $id2 = $this->postJson('/api/reviews', $this->reviewPayload($product))
            ->assertStatus(201)
            ->json('data.id');
        $this->assertDatabaseHas('reviews', ['id' => $id2, 'is_verified_purchase' => false]);
    }

    public function test_client_supplied_flag_cannot_fake_verification(): void
    {
        $product = $this->product();
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $id = $this->postJson('/api/reviews', $this->reviewPayload($product, [
            'is_verified_purchase' => true,
        ]))->assertStatus(201)->json('data.id');

        $this->assertDatabaseHas('reviews', ['id' => $id, 'is_verified_purchase' => false]);
    }
}
