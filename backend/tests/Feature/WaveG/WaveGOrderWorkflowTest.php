<?php

namespace Tests\Feature\WaveG;

use App\Models\User;
use Modules\Orders\Entities\Order;
use Modules\Orders\Entities\OrderItem;
use Modules\Orders\Entities\OrderTracking;
use Modules\Products\Entities\Product;
use Modules\Products\Entities\ProductVariant;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * Wave G - spec §32 order workflow: tax on placement, cancel/complete
 * transitions, return hold (refund_requested) and dispute hold (disputed)
 * with resume-on-close.
 */
class WaveGOrderWorkflowTest extends TestCase
{
    private Vendor $vendor;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $vendorUser = $this->createVendorUser();
        $this->vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => 'Workflow Store',
            'category' => 'general',
        ]);

        $this->product = Product::create([
            'vendor_id' => $this->vendor->id,
            'name' => 'Workflow Widget',
            'category' => 'general',
            'price' => 25.00,
            'stock_quantity' => 20,
            'is_active' => true,
            'approved_at' => now(),
        ]);
    }

    private function placeOrder(User $customer, int $qty = 2, ?string $variantId = null): string
    {
        $items = [['product_id' => $this->product->id, 'quantity' => $qty]];
        if ($variantId) {
            $items[0]['variant_id'] = $variantId;
        }

        $res = $this->actingAs($customer, 'sanctum')->postJson('/api/product-orders', [
            'items' => $items,
            'shipping_address' => '123 Workflow St',
            'shipping_city' => 'Springfield',
            'phone' => '+1-555-0101',
        ]);
        $res->assertStatus(201);

        return $res->json('data.id');
    }

    private function deliveredOrder(User $customer): Order
    {
        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'EN-WG' . strtoupper(substr((string) \Illuminate\Support\Str::uuid(), 0, 6)),
            'status' => 'delivered',
            'subtotal' => 50.00,
            'total_amount' => 50.00,
            'currency' => 'USD',
            'shipping_address' => '123 Test St',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'vendor_id' => $this->vendor->id,
            'product_name' => 'Workflow Widget',
            'quantity' => 1,
            'unit_price' => 50.00,
            'total_price' => 50.00,
        ]);

        return $order;
    }

    public function test_place_order_stores_tax_and_stays_totally_consistent(): void
    {
        $customer = $this->createUser();
        $orderId = $this->placeOrder($customer, 2);

        $order = Order::find($orderId);
        $this->assertSame('pending', $order->status);
        // Default tax rate is 0 - the column exists and equals 0.00.
        $this->assertEquals(0.00, (float) $order->tax);
        $this->assertEquals(50.00, (float) $order->total_amount);
        $this->assertEquals(50.00, (float) $order->subtotal + (float) $order->shipping_fee + (float) $order->tax - (float) $order->discount);
    }

    public function test_place_order_records_variant_line(): void
    {
        $variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => 'Gift Wrap',
            'price' => 30.00,
            'stock_quantity' => 8,
            'is_active' => true,
        ]);

        $customer = $this->createUser();
        $orderId = $this->placeOrder($customer, 2, $variant->id);

        $item = Order::find($orderId)->items()->first();
        $this->assertEquals($variant->id, $item->variant_id);
        $this->assertEquals('Gift Wrap', $item->variant_name);
        $this->assertEquals(30.00, (float) $item->unit_price);

        // Variant stock decremented alongside product stock rules.
        $this->assertEquals(6, $variant->fresh()->stock_quantity);
    }

    public function test_cancel_restores_variant_stock_and_marks_order_cancelled(): void
    {
        $variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => 'Bundle',
            'price' => 25.00,
            'stock_quantity' => 5,
            'is_active' => true,
        ]);

        $customer = $this->createUser();
        $orderId = $this->placeOrder($customer, 2, $variant->id);
        $this->assertEquals(3, $variant->fresh()->stock_quantity);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/product-orders/{$orderId}/cancel")
            ->assertStatus(200);

        $order = Order::find($orderId);
        $this->assertSame('cancelled', $order->status);
        $this->assertEquals(5, $variant->fresh()->stock_quantity);
        $this->assertDatabaseHas('order_tracking', [
            'order_id' => $orderId,
            'status' => 'cancelled',
        ]);
    }

    public function test_customer_can_complete_a_delivered_order(): void
    {
        $customer = $this->createUser();
        $order = $this->deliveredOrder($customer);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/product-orders/{$order->id}/complete")
            ->assertStatus(200);

        $this->assertSame('completed', $order->fresh()->status);
        $this->assertDatabaseHas('order_tracking', [
            'order_id' => $order->id,
            'status' => 'completed',
        ]);
    }

    public function test_complete_rejects_non_delivered_orders(): void
    {
        $customer = $this->createUser();
        $orderId = $this->placeOrder($customer, 1);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/product-orders/{$orderId}/complete")
            ->assertStatus(422);

        $this->assertSame('pending', Order::find($orderId)->status);
    }

    public function test_return_request_freezes_order_and_rejection_resumes_it(): void
    {
        $customer = $this->createUser();
        $order = $this->deliveredOrder($customer);

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/returns', [
                'order_id' => $order->id,
                'reason' => 'Damaged on arrival',
            ])
            ->assertStatus(201);

        $order->refresh();
        $this->assertSame('refund_requested', $order->status);

        $return = \Modules\Orders\Entities\ReturnRequest::where('order_id', $order->id)->firstOrFail();
        $this->assertEquals('delivered', $return->previous_status);

        $this->actingAsAdmin();
        $this->putJson("/api/admin/returns/{$return->id}", ['action' => 'reject'])
            ->assertStatus(200);

        $order->refresh();
        $this->assertSame('delivered', $order->status);
        $this->assertSame('rejected', $return->fresh()->status);
    }

    public function test_dispute_holds_order_and_closing_resumes_it(): void
    {
        $customer = $this->createUser();
        $order = $this->deliveredOrder($customer);

        $create = $this->actingAs($customer, 'sanctum')->postJson('/api/disputes', [
            'order_id' => $order->id,
            'subject' => 'Never arrived',
            'description' => 'Tracking stopped updating',
        ]);
        $create->assertStatus(201);

        $order->refresh();
        $this->assertSame('disputed', $order->status);
        $this->assertEquals('delivered', $create->json('data.previous_status'));

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/disputes/' . $create->json('data.id') . '/close')
            ->assertStatus(200);

        $order->refresh();
        $this->assertSame('delivered', $order->status);
        $this->assertDatabaseHas('order_tracking', [
            'order_id' => $order->id,
            'status' => 'disputed',
        ]);
    }

    public function test_dispute_rejects_someone_elses_order(): void
    {
        $owner = $this->createUser();
        $intruder = $this->createUser();
        $order = $this->deliveredOrder($owner);

        $this->actingAs($intruder, 'sanctum')->postJson('/api/disputes', [
            'order_id' => $order->id,
            'subject' => 'Not mine',
            'description' => 'Should be rejected',
        ])->assertStatus(403);

        $this->assertSame('delivered', $order->fresh()->status);
    }

    public function test_dispute_rejects_terminal_orders(): void
    {
        $customer = $this->createUser();
        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'EN-CANC',
            'status' => 'cancelled',
            'subtotal' => 10.00,
            'total_amount' => 10.00,
            'currency' => 'USD',
            'shipping_address' => '123',
        ]);

        $this->actingAs($customer, 'sanctum')->postJson('/api/disputes', [
            'order_id' => $order->id,
            'subject' => 'Too late',
            'description' => 'Order already cancelled',
        ])->assertStatus(422);
    }

    public function test_admin_dispute_resolution_resumes_the_order_unless_a_refund_is_due(): void
    {
        $customer = $this->createUser();
        $order = $this->deliveredOrder($customer);

        $create = $this->actingAs($customer, 'sanctum')->postJson('/api/disputes', [
            'order_id' => $order->id,
            'subject' => 'Damaged parcel',
            'description' => 'Box arrived crushed',
        ]);
        $create->assertStatus(201);
        $disputeId = $create->json('data.id');
        $this->assertSame('disputed', $order->fresh()->status);

        // A replacement resolution hands the order back to its old status.
        $this->actingAsAdmin();
        $this->putJson("/api/admin/disputes/{$disputeId}", [
            'status' => 'resolved',
            'resolution' => 'replacement',
        ])->assertStatus(200);
        $this->assertSame('delivered', $order->fresh()->status);

        // Hold it again, then resolve with a refund: the order stays disputed
        // until the gateway refund marks it refunded.
        $this->actingAs($customer, 'sanctum');
        $order->update(['status' => 'disputed']);
        $this->actingAsAdmin();
        $this->putJson("/api/admin/disputes/{$disputeId}", [
            'status' => 'resolved',
            'resolution' => 'refund',
        ])->assertStatus(200);
        $this->assertSame('disputed', $order->fresh()->status);
    }

    public function test_completed_status_is_accepted_by_the_database_constraint(): void
    {
        $customer = $this->createUser();
        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'EN-COMPLETED',
            'status' => 'completed',
            'subtotal' => 10.00,
            'total_amount' => 10.00,
            'currency' => 'USD',
            'shipping_address' => '123',
        ]);

        $this->assertSame('completed', Order::find($order->id)->status);
        $this->assertContains($order->status, Order::STATUSES);
        $this->assertContains($order->status, Order::ACTIVE);
    }
}
