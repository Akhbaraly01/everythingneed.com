<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Events\PaymentCompleted;
use Tests\TestCase;

/**
 * TODO 16 async confirmation: gateway-side success propagates to the linked
 * request exactly once; anything else is ignored.
 */
class NeedPaymentSyncTest extends TestCase
{
    private function acceptedRequest(): array
    {
        $category = NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
        $owner = $this->createUser();
        $provider = $this->createUser();

        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Deep clean apartment',
            'description' => 'Full deep clean including windows.',
            'status' => NeedRequest::STATUS_ACCEPTED,
        ]);

        NeedOffer::create([
            'need_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 120,
            'message' => 'Available tomorrow.',
            'status' => NeedOffer::STATUS_ACCEPTED,
        ]);

        return [$request, $owner, $provider];
    }

    private function nrpayPayment(NeedRequest $request, object $owner): Payment
    {
        return Payment::create([
            'order_id' => $request->id,
            'user_id' => $owner->id,
            'amount' => 120,
            'currency' => 'USD',
            'method' => 'card',
            'reference' => 'NRPAY-' . strtoupper(uniqid()),
            'status' => Payment::STATUS_PENDING,
        ]);
    }

    public function test_gateway_confirmation_advances_request_to_paid(): void
    {
        [$request, $owner, $provider] = $this->acceptedRequest();
        $payment = $this->nrpayPayment($request, $owner);

        PaymentCompleted::dispatch($payment);

        $this->assertEquals('paid', $request->fresh()->status);
        $this->assertDatabaseHas('need_request_events', [
            'need_request_id' => $request->id,
            'action' => 'pay',
            'to_status' => 'paid',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $provider->id,
            'type' => 'need_paid',
        ]);
    }

    public function test_replay_never_double_advances(): void
    {
        [$request, $owner] = $this->acceptedRequest();
        $payment = $this->nrpayPayment($request, $owner);

        PaymentCompleted::dispatch($payment);
        PaymentCompleted::dispatch($payment);

        $this->assertEquals('paid', $request->fresh()->status);
        $this->assertEquals(1, NeedRequestEvent::where('need_request_id', $request->id)
            ->where('action', 'pay')
            ->count());
    }

    public function test_non_needs_payments_are_ignored(): void
    {
        [$request, $owner] = $this->acceptedRequest();
        $payment = Payment::create([
            'order_id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $owner->id,
            'amount' => 50,
            'currency' => 'USD',
            'method' => 'card',
            'reference' => 'ORD-' . strtoupper(uniqid()),
            'status' => Payment::STATUS_PENDING,
        ]);

        PaymentCompleted::dispatch($payment);

        $this->assertEquals('accepted', $request->fresh()->status);
    }
}
