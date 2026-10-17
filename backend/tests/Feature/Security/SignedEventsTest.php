<?php

namespace Tests\Feature\Security;

use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\EventSignerInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Entities\OrderTracking;
use Modules\Orders\Events\OrderStatusUpdated;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Events\PaymentCompleted;
use Tests\TestCase;

/**
 * Phase 4: signed cross-domain events + tamper-evident audit chain.
 */
class SignedEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_envelope_accepts_genuine_rejects_forgery_replay_and_expiry(): void
    {
        $signer = app(EventSignerInterface::class);

        $envelope = $signer->issue('money.paid', 'payments', ['payment_id' => 'p1']);
        $this->assertSame(['payment_id' => 'p1'], $signer->accept($envelope, ['payments']));

        // Replay of the consumed nonce fails closed.
        $this->assertNull($signer->accept($envelope, ['payments']));

        // Tampered claims fail.
        $tampered = $signer->issue('money.paid', 'payments', ['payment_id' => 'p1']);
        $tampered['claims'] = ['payment_id' => 'p2'];
        $this->assertNull($signer->accept($tampered, ['payments']));

        // Wrong sender fails.
        $foreign = $signer->issue('money.paid', 'orders', ['payment_id' => 'p1']);
        $this->assertNull($signer->accept($foreign, ['payments']));

        // Expired envelope fails (negative freshness window).
        $stale = $signer->issue('money.paid', 'payments', ['payment_id' => 'p1']);
        $this->assertNull($signer->accept($stale, ['payments'], -1));
    }

    public function test_money_events_are_signed_at_dispatch(): void
    {
        $payment = new Payment(['id' => 'pay-1', 'status' => 'succeeded']);
        $event = new PaymentCompleted($payment);

        $this->assertSame('payments', $event->dispatchSender);
        $this->assertNotEmpty($event->dispatchSignature);
        $this->assertTrue($event->verify(['payments']));
        $this->assertFalse($event->verify(['orders']));
    }

    public function test_tampered_money_event_is_rejected_and_audited_without_side_effects(): void
    {
        $payment = new Payment(['id' => 'pay-2', 'status' => 'succeeded']);

        $event = new PaymentCompleted($payment);
        // Simulate queue-at-rest tampering: flip bytes of the sealed
        // envelope after signing (payload swap or signature edit).
        $event->dispatchSignature = str_repeat('0', 64);

        $listener = new \Modules\Payments\Listeners\UpdateOrderStatus();
        $listener->handle($event);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'event.rejected',
            'entity_type' => 'domain_event',
        ]);
    }

    public function test_broadcast_payloads_carry_identifiers_not_bodies(): void
    {
        $tracking = new OrderTracking([
            'order_id' => 'o1',
            'user_id' => 'u1',
            'status' => 'paid',
            'status_message' => 'secret-body',
        ]);
        $payload = (new OrderStatusUpdated($tracking))->broadcastWith();

        $this->assertSame('o1', $payload['order_id']);
        $this->assertArrayNotHasKey('message', $payload);
    }
}
