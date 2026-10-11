<?php

namespace Tests\Feature\Journeys;

use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class AdminOrderRefundJourneyTest extends TestCase
{
    /** Places a real order through checkout and returns [vendorUser, vendorOrderId]. */
    private function placeVendorOrder(): array
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
            'name' => 'Refundable Widget',
            'description' => 'Test product',
            'category' => 'electronics',
            'price' => 40.00,
            'stock_quantity' => 5,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/product-orders', [
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
                'shipping_address' => '123 Test Street',
            ])
            ->assertStatus(201);

        $vendorOrderId = $this->actingAs($vendorUser, 'sanctum')
            ->getJson('/api/vendor/orders')
            ->assertOk()
            ->json('data.0.id');

        return [$vendorUser, $vendorOrderId];
    }

    public function test_admin_refund_marks_sub_order_refunded_and_is_idempotent(): void
    {
        [, $vendorOrderId] = $this->placeVendorOrder();

        $this->actingAsAdmin();
        $this->postJson("/api/admin/orders/{$vendorOrderId}/refund", ['reason' => 'Customer complaint'])
            ->assertOk()
            ->assertJsonFragment(['message' => 'Refund issued successfully']);
        $this->assertDatabaseHas('vendor_orders', ['id' => $vendorOrderId, 'status' => 'refunded']);

        // Second refund of the same sub-order is rejected
        $this->postJson("/api/admin/orders/{$vendorOrderId}/refund", [])->assertStatus(422);
    }

    public function test_administrator_role_is_allowed_but_finance_and_strangers_are_not(): void
    {
        [, $vendorOrderId] = $this->placeVendorOrder();

        // Plain user -> 403
        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum');
        $this->postJson("/api/admin/orders/{$vendorOrderId}/refund", [])->assertStatus(403);

        // finance_admin is NOT in the manageOrders policy (super_admin/administrator only)
        $finance = $this->createUser();
        $this->assignRole($finance, 'finance_admin');
        $this->actingAs($finance, 'sanctum');
        $this->postJson("/api/admin/orders/{$vendorOrderId}/refund", [])->assertStatus(403);

        // administrator is allowed
        $administrator = $this->createUser();
        $this->assignRole($administrator, 'administrator');
        $this->actingAs($administrator, 'sanctum');
        $this->postJson("/api/admin/orders/{$vendorOrderId}/refund", ['reason' => 'Approved goodwill'])
            ->assertOk();
        $this->assertDatabaseHas('vendor_orders', ['id' => $vendorOrderId, 'status' => 'refunded']);
    }

    public function test_unknown_sub_order_returns_404(): void
    {
        $this->actingAsAdmin();
        $this->postJson('/api/admin/orders/'.\Str::uuid().'/refund', [])
            ->assertStatus(404)
            ->assertJsonFragment(['message' => 'Order not found']);
    }
}
