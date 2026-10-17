<?php

namespace Modules\Needs\Listeners;

use Core\Events\Concerns\VerifiesEvents;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;
use Modules\Payments\Events\PaymentCompleted;

/**
 * TODO 16 async payment confirmation: when the gateway confirms an NRPAY
 * owner charge after the fact (webhook, delayed capture), the linked
 * request advances accepted/payment_pending → paid exactly once. Unsigned,
 * forged, or replayed money events never move request state; synchronous
 * pay() already paid rows are left untouched (idempotent by status gate).
 */
class SyncNeedRequestPayment implements ShouldQueue
{
    use InteractsWithQueue, VerifiesEvents;

    public function handle(PaymentCompleted $event): void
    {
        if (! $this->verified($event, ['payments'])) {
            return;
        }

        $payment = $event->payment;

        if (! str_starts_with((string) ($payment->reference ?? ''), 'NRPAY-')) {
            return;
        }

        $request = NeedRequest::where('id', $payment->order_id)->first();

        if (! $request) {
            return;
        }

        if (! in_array($request->status, [
            NeedRequest::STATUS_ACCEPTED,
            NeedRequest::STATUS_PAYMENT_PENDING,
        ], true)) {
            return;
        }

        $previous = $request->status;
        $request->update(['status' => NeedRequest::STATUS_PAID]);

        NeedRequestEvent::create([
            'need_request_id' => $request->id,
            'actor_id' => null,
            'from_status' => $previous,
            'to_status' => NeedRequest::STATUS_PAID,
            'action' => 'pay',
            'note' => 'Gateway confirmed ' . $payment->reference,
        ]);

        if ($request->acceptedOffer) {
            app(\Core\Services\NotificationService::class)->notify(
                (string) $request->acceptedOffer->provider_id,
                'Payment received',
                "'{$request->title}' is paid — you can start work now.",
                'need_paid',
                $request->id
            );
        }
    }
}
