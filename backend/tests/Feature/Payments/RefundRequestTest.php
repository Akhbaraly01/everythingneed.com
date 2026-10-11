<?php

namespace Tests\Feature\Payments;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;
use Tests\TestCase;

/**
 * Gap 3: a refund is REQUESTED first (pending, no money moves), then support
 * reviews it in the queue — approve pays back via the SAME method the
 * customer paid with; reject records a reason. Requests are idempotent and
 * never double-charge the refundable balance.
 */
class RefundRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['payments.driver' => 'mock']);
    }

    private function succeededPayment(float $amount = 100.0, ?string $userId = null, string $method = 'card'): Payment
    {
        $userId ??= $this->createUser()->id;

        return Payment::create([
            'user_id' => $userId,
            'amount' => $amount,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => $method,
            'reference' => 'PAY-REQ-'.uniqid(),
        ]);
    }

    public function test_customer_raises_a_pending_refund_request_and_no_money_moves(): void
    {
        $user = $this->actingAsUser();
        $payment = $this->succeededPayment(80.0, $user->id);

        $res = $this->postJson("/api/payments/{$payment->id}/refund-request", [
            'reason' => 'Wrong size',
        ]);

        $res->assertStatus(202)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.method', 'card')
            ->assertJsonPath('data.requested_by', $user->id);

        // No money moved: the payment is still succeeded.
        $payment->refresh();
        $this->assertSame('succeeded', $payment->status);
    }

    public function test_refund_request_is_idempotent_by_key(): void
    {
        $user = $this->actingAsUser();
        $payment = $this->succeededPayment(60.0, $user->id);

        $first = $this->postJson("/api/payments/{$payment->id}/refund-request", [
            'idempotency_key' => 'key-123',
        ]);
        $second = $this->postJson("/api/payments/{$payment->id}/refund-request", [
            'idempotency_key' => 'key-123',
        ]);

        $first->assertStatus(202);
        $second->assertStatus(202);
        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, Refund::where('payment_id', $payment->id)->count());
    }

    public function test_customer_cannot_request_refund_on_another_users_payment(): void
    {
        $this->actingAsUser();
        $payment = $this->succeededPayment(40.0);

        $this->postJson("/api/payments/{$payment->id}/refund-request", [])->assertNotFound();
    }

    public function test_pending_requests_reserve_the_refundable_balance(): void
    {
        $user = $this->actingAsUser();
        $payment = $this->succeededPayment(100.0, $user->id);

        $this->postJson("/api/payments/{$payment->id}/refund-request", [
            'amount' => 70.0,
        ])->assertStatus(202);

        // Only 30.00 remains once the pending request reserves 70.00.
        $this->postJson("/api/payments/{$payment->id}/refund-request", [
            'amount' => 50.0,
        ])->assertStatus(422);
    }

    public function test_support_approving_a_request_pays_back_same_method(): void
    {
        $user = $this->createUser();
        $payment = $this->succeededPayment(90.0, $user->id);
        $refund = app(\Modules\Payments\Actions\RequestRefund::class)->execute([
            'payment_id' => $payment->id,
            'requested_by' => $user->id,
            'reason' => 'Duplicate charge',
        ]);

        $admin = $this->actingAsAdmin();
        $res = $this->putJson("/api/admin/refunds/{$refund->id}", ['action' => 'approve']);

        $res->assertOk()->assertJsonPath('data.status', 'completed');
        $this->assertSame($admin->id, $refund->fresh()->reviewed_by);
        $this->assertSame('card', $refund->fresh()->method);

        $payment->refresh();
        $this->assertSame('refunded', $payment->status);
    }

    public function test_support_rejecting_a_request_records_reason_and_keeps_payment(): void
    {
        $user = $this->createUser();
        $payment = $this->succeededPayment(50.0, $user->id);
        $refund = app(\Modules\Payments\Actions\RequestRefund::class)->execute([
            'payment_id' => $payment->id,
            'requested_by' => $user->id,
            'reason' => 'Buyer remorse past window',
        ]);

        $this->actingAsAdmin();
        $res = $this->putJson("/api/admin/refunds/{$refund->id}", [
            'action' => 'reject',
            'reason' => 'Outside 30-day window',
        ]);

        $res->assertOk()->assertJsonPath('data.status', 'rejected');

        $fresh = $refund->fresh();
        $this->assertSame('Outside 30-day window', $fresh->rejection_reason);
        $this->assertNotNull($fresh->reviewed_by);

        // Money never moved.
        $this->assertSame('succeeded', $payment->fresh()->status);
    }

    public function test_reviewing_twice_is_422_and_never_double_pays(): void
    {
        $user = $this->createUser();
        $payment = $this->succeededPayment(70.0, $user->id);
        $refund = app(\Modules\Payments\Actions\RequestRefund::class)->execute([
            'payment_id' => $payment->id,
            'requested_by' => $user->id,
        ]);

        $this->actingAsAdmin();
        $this->putJson("/api/admin/refunds/{$refund->id}", ['action' => 'approve'])->assertOk();
        $this->putJson("/api/admin/refunds/{$refund->id}", ['action' => 'approve'])->assertStatus(422);

        // Exactly one refund row, exactly one payout.
        $this->assertSame(1, Refund::where('payment_id', $payment->id)->count());
        $this->assertSame('refunded', $payment->fresh()->status);
    }

    public function test_customer_sees_own_refund_requests(): void
    {
        $user = $this->actingAsUser();
        $mine = $this->succeededPayment(30.0, $user->id);
        $this->succeededPayment(999.0); // someone else's

        app(\Modules\Payments\Actions\RequestRefund::class)->execute([
            'payment_id' => $mine->id,
            'requested_by' => $user->id,
            'reason' => 'Not as described',
        ]);

        $res = $this->getJson('/api/refunds/mine');
        $res->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame($mine->id, $res->json('data.0.payment_id'));
    }

    public function test_cancelling_a_paid_order_raises_a_refund_request_immediately(): void
    {
        $user = $this->actingAsUser();

        $order = \Modules\Orders\Entities\Order::create([
            'user_id' => $user->id,
            'order_number' => 'EN-CANCEL-'.uniqid(),
            'status' => 'paid',
            'subtotal' => 45.0,
            'total_amount' => 45.0,
            'currency' => 'USD',
            'shipping_address' => '1 Cancel St',
        ]);
        $payment = Payment::create([
            'order_id' => $order->id,
            'user_id' => $user->id,
            'amount' => 45.0,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-CANCEL-'.uniqid(),
        ]);

        $this->postJson("/api/product-orders/{$order->id}/cancel")->assertOk();

        $request = Refund::where('cancellation_id', $order->id)->first();
        $this->assertNotNull($request, 'cancelling a paid order raises a refund request');
        $this->assertSame('pending', $request->status);
        $this->assertSame($payment->id, $request->payment_id);
        $this->assertSame('card', $request->method);

        // No money moved at cancel time — support processes it later.
        $this->assertSame('succeeded', $payment->fresh()->status);
    }

    public function test_wallet_backed_request_credits_the_wallet_on_approve(): void
    {
        $user = $this->createUser();
        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => 25.0,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'wallet',
            'provider' => 'wallet',
            'reference' => 'PAY-WALLET-'.uniqid(),
        ]);

        // Real ledger rows: fund the wallet, then pay the charge (debit).
        $wallet = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $wallet->topUp($user->id, 25.0, 'SEED-'.uniqid());
        $wallet->debit($user->id, 25.0, 'WALLET-PAY-'.$payment->id, 'Wallet payment');

        $refund = app(\Modules\Payments\Actions\RequestRefund::class)->execute([
            'payment_id' => $payment->id,
            'requested_by' => $user->id,
        ]);

        $this->actingAsAdmin();
        $this->putJson("/api/admin/refunds/{$refund->id}", ['action' => 'approve'])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        // Same-method: wallet money came back as a wallet credit.
        $this->assertTrue(
            \App\Models\WalletTransaction::where('type', 'credit')
                ->where('reference', 'WALLET-REF-'.$refund->id)
                ->exists()
        );
        $this->assertSame('refunded', $payment->fresh()->status);
    }
}
