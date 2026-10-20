<?php

namespace Tests\Feature\Admin;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Entities\Order;
use Modules\Orders\Entities\ReturnRequest;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

class ReturnDecisionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['payments.driver' => 'mock']);
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    private function createPendingReturn(bool $withPayment = true, float $amount = 50.0): array
    {
        $customer = $this->createUser();

        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'EN-RMA001',
            'status' => 'delivered',
            'subtotal' => $amount,
            'total_amount' => $amount,
            'currency' => 'USD',
            'shipping_address' => '123 Test St',
        ]);

        $payment = null;
        if ($withPayment) {
            $payment = Payment::create([
                'order_id' => $order->id,
                'user_id' => $customer->id,
                'amount' => $amount,
                'currency' => 'USD',
                'status' => 'succeeded',
                'method' => 'card',
                'reference' => 'PAY-RMA-'.uniqid(),
            ]);
        }

        $return = ReturnRequest::create([
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'reason' => 'Item damaged',
            'description' => 'Arrived broken',
            'status' => 'pending',
        ]);

        return [$order, $payment, $return];
    }

    public function test_admin_can_list_returns_with_requester_context_and_status_filter(): void
    {
        [, , $return] = $this->createPendingReturn();
        $this->actingAsAdmin();

        $res = $this->getJson('/api/admin/returns?status=pending');

        $res->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', (string) $return->id)
            ->assertJsonPath('data.0.status', 'pending')
            ->assertJsonStructure(['data' => [['id', 'status', 'requester_name', 'requester_email', 'reason', 'created_at']], 'meta']);

        $this->getJson('/api/admin/returns?status=refunded')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_returns_endpoints_are_role_gated(): void
    {
        [, , $return] = $this->createPendingReturn();

        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum');
        $this->getJson('/api/admin/returns')->assertStatus(403);
        $this->putJson("/api/admin/returns/{$return->id}", ['action' => 'approve'])->assertStatus(403);

        $moderator = $this->createUser();
        $this->assignRole($moderator, 'moderator');
        $this->actingAs($moderator, 'sanctum');
        $this->getJson('/api/admin/returns')->assertOk();
    }

    public function test_approve_issues_gateway_refund_and_marks_everything_refunded_with_audit(): void
    {
        [$order, $payment, $return] = $this->createPendingReturn();
        $this->actingAsAdmin();

        $res = $this->putJson("/api/admin/returns/{$return->id}", [
            'action' => 'approve',
            'admin_notes' => 'Confirmed damaged in warehouse',
        ]);

        $res->assertOk()->assertJsonPath('data.status', 'refunded');

        $this->assertDatabaseHas('return_requests', [
            'id' => $return->id, 'status' => 'refunded', 'admin_notes' => 'Confirmed damaged in warehouse',
        ]);
        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'status' => 'refunded']);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'refunded']);
        $this->assertDatabaseHas('refunds', ['payment_id' => $payment->id, 'status' => 'completed']);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'return.approved',
            'entity_type' => 'return_request',
            'entity_id' => (string) $return->id,
        ]);
    }

    public function test_approve_with_partial_refund_amount_keeps_payment_partially_refunded(): void
    {
        [, $payment, $return] = $this->createPendingReturn(withPayment: true, amount: 50.0);
        $this->actingAsAdmin();

        $res = $this->putJson("/api/admin/returns/{$return->id}", [
            'action' => 'approve',
            'refund_amount' => 20,
        ]);

        $res->assertOk()->assertJsonPath('data.status', 'refunded');
        $this->assertDatabaseHas('return_requests', ['id' => $return->id, 'status' => 'refunded', 'refund_amount' => 20]);
        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'status' => 'partially_refunded']);
    }

    public function test_approve_without_a_refundable_payment_is_422(): void
    {
        [, , $return] = $this->createPendingReturn(withPayment: false);
        $this->actingAsAdmin();

        $res = $this->putJson("/api/admin/returns/{$return->id}", ['action' => 'approve']);

        $res->assertStatus(422)->assertJsonFragment(['message' => 'No refundable payment found for this order']);
        $this->assertDatabaseHas('return_requests', ['id' => $return->id, 'status' => 'pending']);
    }

    public function test_deciding_a_return_twice_is_422(): void
    {
        [, , $return] = $this->createPendingReturn();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/returns/{$return->id}", ['action' => 'approve'])->assertOk();
        $second = $this->putJson("/api/admin/returns/{$return->id}", ['action' => 'approve']);

        $second->assertStatus(422)->assertJsonFragment(['message' => 'Return request has already been decided']);
    }

    public function test_reject_records_notes_without_touching_the_payment_and_is_audited(): void
    {
        [, $payment, $return] = $this->createPendingReturn();

        $finance = $this->createUser();
        $this->assignRole($finance, 'finance_admin');
        $this->actingAs($finance, 'sanctum');

        $res = $this->putJson("/api/admin/returns/{$return->id}", [
            'action' => 'reject',
            'admin_notes' => 'Outside return window',
        ]);

        $res->assertOk()->assertJsonPath('data.status', 'rejected');
        $this->assertDatabaseHas('return_requests', [
            'id' => $return->id, 'status' => 'rejected', 'admin_notes' => 'Outside return window',
        ]);
        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'status' => 'succeeded']);
        $this->assertDatabaseCount('refunds', 0);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'return.rejected',
            'entity_type' => 'return_request',
            'entity_id' => (string) $return->id,
        ]);
    }

    public function test_invalid_action_is_422_and_unknown_return_is_404(): void
    {
        [, , $return] = $this->createPendingReturn();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/returns/{$return->id}", ['action' => 'maybe'])->assertStatus(422);
        $this->putJson('/api/admin/returns/'.\Str::uuid(), ['action' => 'approve'])->assertStatus(404);
    }
}
