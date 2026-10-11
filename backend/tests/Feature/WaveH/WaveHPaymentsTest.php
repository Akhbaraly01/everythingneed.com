<?php

namespace Tests\Feature\WaveH;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Support\PaymentStateMachine;
use Tests\TestCase;

class WaveHPaymentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_http_charge_replays_the_original_payment_for_the_same_idempotency_key(): void
    {
        $user = $this->createUser();

        $first = $this->actingAs($user, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 42.00,
            'method' => 'card',
            'idempotency_key' => 'checkout-retry-1',
        ])->assertStatus(201);

        $second = $this->actingAs($user, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 42.00,
            'method' => 'card',
            'idempotency_key' => 'checkout-retry-1',
        ])->assertStatus(201);

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(
            1,
            Payment::where('idempotency_key', 'checkout-retry-1')->count()
        );

        $third = $this->actingAs($user, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 42.00,
            'method' => 'card',
            'idempotency_key' => 'checkout-retry-2',
        ])->assertStatus(201);
        $this->assertNotSame($first->json('data.id'), $third->json('data.id'));
    }

    public function test_charge_records_server_derived_purpose_and_wallet_deposit_marks_its_own(): void
    {
        config(['payments.driver' => 'mock']);
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 10,
            'method' => 'card',
        ])->assertStatus(201);

        $this->assertDatabaseHas('payments', [
            'user_id' => $user->id,
            'purpose' => 'checkout',
        ]);

        app(\Modules\Wallet\Services\WalletService::class)
            ->deposit($user->id, 25, 'card', 'waveh-dep-1');

        $this->assertDatabaseHas('payments', [
            'user_id' => $user->id,
            'purpose' => 'wallet_deposit',
        ]);
    }

    public function test_cancelled_state_and_transition_rules_follow_the_spec_workflow(): void
    {
        $user = $this->createUser();
        Payment::create([
            'user_id' => $user->id,
            'amount' => 5,
            'currency' => 'USD',
            'status' => 'cancelled',
            'method' => 'card',
            'reference' => 'PAY-CANCELLED-1',
            'purpose' => 'checkout',
        ]);
        $this->assertDatabaseHas('payments', ['reference' => 'PAY-CANCELLED-1', 'status' => 'cancelled']);

        $this->assertTrue(PaymentStateMachine::canTransition('pending', 'cancelled'));
        $this->assertTrue(PaymentStateMachine::canTransition('processing', 'succeeded'));
        $this->assertTrue(PaymentStateMachine::canTransition('succeeded', 'partially_refunded'));
        $this->assertTrue(PaymentStateMachine::canTransition('partially_refunded', 'refunded'));
        $this->assertTrue(PaymentStateMachine::canTransition('succeeded', 'succeeded'), 'same-state writes are idempotent');
        $this->assertFalse(PaymentStateMachine::canTransition('refunded', 'failed'), 'refunded is terminal');
        $this->assertFalse(PaymentStateMachine::canTransition('refunded', 'succeeded'), 'no resurrecting money');
        $this->assertFalse(PaymentStateMachine::canTransition('failed', 'succeeded'), 'failed never flips via webhook');
        $this->assertFalse(PaymentStateMachine::canTransition('cancelled', 'pending'));
    }

    public function test_webhook_state_transition_validation_ignores_stale_events(): void
    {
        $user = $this->createUser();
        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => 10,
            'currency' => 'USD',
            'status' => 'refunded',
            'method' => 'card',
            'reference' => 'PAY-WH-REFUNDED',
            'provider' => 'stripe',
            'provider_payment_id' => 'pi_refunded_1',
        ]);

        // A stale failure event must not rewrite a refunded payment.
        $this->postJson('/api/webhooks/payments/stripe', [
            'id' => 'evt_stale_fail',
            'type' => 'payment_intent.payment_failed',
            'data' => ['object' => ['id' => 'pi_refunded_1']],
        ])->assertOk();

        $this->assertSame('refunded', $payment->fresh()->status);

        $event = DB::table('payment_webhook_events')->where('event_id', 'evt_stale_fail')->first();
        $this->assertNotNull($event);
        $this->assertSame('ignored', $event->status);
        $this->assertSame($payment->id, $event->payment_id);
    }

    public function test_stripe_cancel_event_moves_a_pending_payment_to_cancelled(): void
    {
        $user = $this->createUser();
        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => 10,
            'currency' => 'USD',
            'status' => 'pending',
            'method' => 'card',
            'reference' => 'PAY-WH-CANCEL',
            'provider' => 'stripe',
            'provider_payment_id' => 'pi_cancel_1',
        ]);

        $this->postJson('/api/webhooks/payments/stripe', [
            'id' => 'evt_cancel_1',
            'type' => 'payment_intent.canceled',
            'data' => ['object' => ['id' => 'pi_cancel_1']],
        ])->assertOk();

        $this->assertSame('cancelled', $payment->fresh()->status);

        $event = DB::table('payment_webhook_events')->where('event_id', 'evt_cancel_1')->first();
        $this->assertSame('processed', $event->status);
        $this->assertSame($payment->id, $event->payment_id);
    }

    public function test_unknown_payment_driver_fails_loudly_instead_of_falling_back_to_mock(): void
    {
        config(['payments.driver' => 'definitely_not_a_gateway']);

        $this->expectException(\InvalidArgumentException::class);

        app(\Core\Services\Contracts\PaymentGatewayInterface::class)->charge([
            'user_id' => $this->createUser()->id,
            'amount' => 10,
            'method' => 'card',
        ]);
    }

    public function test_chained_partial_refunds_accumulate_to_the_spec_states(): void
    {
        config(['payments.driver' => 'mock']);
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 200,
            'method' => 'card',
        ])->assertStatus(201);

        $payment = Payment::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('succeeded', $payment->status);

        $refunder = app(\Modules\Payments\Actions\RefundPayment::class);

        $refunder->execute($payment->id, 50);
        $this->assertSame('partially_refunded', $payment->fresh()->status);

        $refunder->execute($payment->id, 60);
        $this->assertSame('partially_refunded', $payment->fresh()->status);

        $refunder->execute($payment->id, 90);
        $this->assertSame('refunded', $payment->fresh()->status);

        // Fully refunded: nothing left to return.
        try {
            $refunder->execute($payment->id, 10);
            $this->fail('Expected a ValidationException after the payment was fully refunded');
        } catch (\Core\Exceptions\ValidationException) {
            $this->assertSame('refunded', $payment->fresh()->status);
        }
    }

    public function test_partial_refunds_can_never_exceed_the_charge(): void
    {
        config(['payments.driver' => 'mock']);
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 100,
            'method' => 'card',
        ])->assertStatus(201);
        $payment = Payment::where('user_id', $user->id)->firstOrFail();

        $refunder = app(\Modules\Payments\Actions\RefundPayment::class);
        $refunder->execute($payment->id, 80);
        $this->assertSame('partially_refunded', $payment->fresh()->status);

        try {
            $refunder->execute($payment->id, 30);
            $this->fail('Expected a ValidationException for an over-refund');
        } catch (\Core\Exceptions\ValidationException) {
            $this->assertSame('partially_refunded', $payment->fresh()->status);
        }

        $completed = (float) DB::table('refunds')
            ->where('payment_id', $payment->id)
            ->where('status', 'completed')
            ->sum('amount');
        $this->assertEqualsWithDelta(80.0, $completed, 0.01);
    }

    public function test_payment_methods_endpoint_reports_the_honest_sandbox_mode(): void
    {
        $user = $this->createUser();

        $this->getJson('/api/payments/methods')->assertStatus(401);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/payments/methods');
        $response->assertOk()
            ->assertJsonPath('data.mode', 'sandbox')
            ->assertJsonPath('data.driver', config('payments.driver'));

        $methods = collect($response->json('data.methods'));
        $this->assertTrue($methods->contains('id', 'card'));
    }

    public function test_reconcile_reports_payment_refund_drift_and_webhook_health(): void
    {
        $user = $this->createUser();
        Payment::create([
            'user_id' => $user->id,
            'amount' => 30,
            'currency' => 'USD',
            'status' => 'refunded',
            'method' => 'card',
            'reference' => 'PAY-DRIFT-1',
        ]);

        $this->artisan('financial:reconcile')
            ->expectsOutputToContain('Payment/refund drifts: 1')
            ->expectsOutputToContain('Webhook events failed: 0, ignored: 0')
            ->assertExitCode(0);
    }
}
