<?php

namespace Tests\Feature\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * W4 order state machine contract: vendor-order status changes go through
 * Modules\Orders\Support\OrderStateMachine — forward-only through the
 * lifecycle, cancel/refund reachable from any active state, cancelled and
 * refunded final, same-state updates idempotent, provider-owned 'paid' never
 * admin-settable. The refund endpoint shares the same terminal guard.
 */
class AdminOrderStateMachineTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrder(string $status): string
    {
        $customer = $this->createUser();
        $owner = $this->createUser();
        $vendor = $this->createVendor($owner);
        $id = (string) Str::uuid();

        DB::table('vendor_orders')->insert([
            'id' => $id,
            'vendor_id' => $vendor->id,
            'customer_id' => $customer->id,
            'product_name' => 'Machine Widget',
            'quantity' => 1,
            'unit_price' => 30,
            'total_price' => 30,
            'order_number' => 'W4-' . strtoupper(Str::random(8)),
            'status' => $status,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    private function statusOf(string $id): string
    {
        return DB::table('vendor_orders')->where('id', $id)->value('status');
    }

    public function test_forward_lifecycle_transitions_are_allowed(): void
    {
        $this->actingAsAdmin();

        $id = $this->makeOrder('pending');

        foreach (['confirmed', 'processing', 'shipped', 'delivered'] as $status) {
            $this->putJson("/api/admin/orders/{$id}/status", ['status' => $status])
                ->assertOk()
                ->assertJsonFragment(['message' => 'Order status updated']);
            $this->assertSame($status, $this->statusOf($id));
        }
    }

    public function test_backward_transition_is_rejected_and_state_unchanged(): void
    {
        $this->actingAsAdmin();

        $id = $this->makeOrder('delivered');

        $this->putJson("/api/admin/orders/{$id}/status", ['status' => 'confirmed'])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Invalid status transition']);
        $this->assertSame('delivered', $this->statusOf($id));

        $processing = $this->makeOrder('processing');
        $this->putJson("/api/admin/orders/{$processing}/status", ['status' => 'pending'])
            ->assertStatus(422);
        $this->assertSame('processing', $this->statusOf($processing));
    }

    public function test_terminal_states_are_final(): void
    {
        $this->actingAsAdmin();

        $cancelled = $this->makeOrder('cancelled');
        $this->putJson("/api/admin/orders/{$cancelled}/status", ['status' => 'shipped'])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Invalid status transition']);
        $this->assertSame('cancelled', $this->statusOf($cancelled));

        $refunded = $this->makeOrder('refunded');
        $this->putJson("/api/admin/orders/{$refunded}/status", ['status' => 'processing'])
            ->assertStatus(422);
        $this->assertSame('refunded', $this->statusOf($refunded));

        // Re-asserting the terminal state itself is an idempotent no-op.
        $this->putJson("/api/admin/orders/{$cancelled}/status", ['status' => 'cancelled'])
            ->assertOk();
        $this->assertSame('cancelled', $this->statusOf($cancelled));
    }

    public function test_same_state_update_is_idempotent(): void
    {
        $this->actingAsAdmin();

        $id = $this->makeOrder('pending');

        $this->putJson("/api/admin/orders/{$id}/status", ['status' => 'pending'])
            ->assertOk();
        $this->assertSame('pending', $this->statusOf($id));
    }

    public function test_cancel_and_refund_outcomes_are_reachable_from_active_states(): void
    {
        $this->actingAsAdmin();

        $processing = $this->makeOrder('processing');
        $this->putJson("/api/admin/orders/{$processing}/status", ['status' => 'cancelled'])
            ->assertOk();
        $this->assertSame('cancelled', $this->statusOf($processing));

        $pending = $this->makeOrder('pending');
        $this->putJson("/api/admin/orders/{$pending}/status", ['status' => 'refunded'])
            ->assertOk();
        $this->assertSame('refunded', $this->statusOf($pending));
    }

    public function test_provider_owned_paid_is_never_admin_settable(): void
    {
        $this->actingAsAdmin();

        $id = $this->makeOrder('pending');

        // 'paid' is excluded from VALID_STATUSES — the request never reaches
        // the state machine (payment state belongs to the provider/webhook).
        $this->putJson("/api/admin/orders/{$id}/status", ['status' => 'paid'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
        $this->assertSame('pending', $this->statusOf($id));

        // And an already-paid order can never step backwards either.
        $paid = $this->makeOrder('paid');
        $this->putJson("/api/admin/orders/{$paid}/status", ['status' => 'pending'])
            ->assertStatus(422);
        $this->assertSame('paid', $this->statusOf($paid));
    }

    public function test_unknown_status_values_are_rejected_by_validation(): void
    {
        $this->actingAsAdmin();

        $id = $this->makeOrder('pending');

        $this->putJson("/api/admin/orders/{$id}/status", ['status' => 'bogus_status'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
        $this->assertSame('pending', $this->statusOf($id));
    }

    public function test_missing_order_returns_404(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/orders/' . Str::uuid() . '/status', ['status' => 'confirmed'])
            ->assertStatus(404)
            ->assertJsonFragment(['message' => 'Order not found']);
    }

    public function test_refund_endpoint_shares_the_terminal_guard(): void
    {
        $this->actingAsAdmin();

        // Active orders refund fine (and are then final).
        $pending = $this->makeOrder('pending');
        $this->postJson("/api/admin/orders/{$pending}/refund", ['reason' => 'W4 guard'])
            ->assertOk()
            ->assertJsonFragment(['message' => 'Refund issued successfully']);
        $this->assertSame('refunded', $this->statusOf($pending));

        $this->postJson("/api/admin/orders/{$pending}/refund", [])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Order already refunded']);

        // Cancelled orders are terminal — no refund path exists from there.
        $cancelled = $this->makeOrder('cancelled');
        $this->postJson("/api/admin/orders/{$cancelled}/refund", [])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Refund not allowed for this order status']);
        $this->assertSame('cancelled', $this->statusOf($cancelled));

        $this->postJson('/api/admin/orders/' . Str::uuid() . '/refund', [])
            ->assertStatus(404);
    }

    public function test_state_machine_rejects_cross_lifecycle_backsteps_before_writing(): void
    {
        $this->actingAsAdmin();

        // shipped → paid is doubly illegal: backwards AND provider-owned.
        $shipped = $this->makeOrder('shipped');
        $this->putJson("/api/admin/orders/{$shipped}/status", ['status' => 'paid'])
            ->assertStatus(422);
        $this->assertSame('shipped', $this->statusOf($shipped));

        // delivered → cancelled (outcome) is legal from any ACTIVE state but a
        // terminal row must stay terminal.
        $refunded = $this->makeOrder('refunded');
        $this->putJson("/api/admin/orders/{$refunded}/status", ['status' => 'cancelled'])
            ->assertStatus(422);
        $this->assertSame('refunded', $this->statusOf($refunded));
    }
}
