<?php

namespace Modules\Payments\Listeners;

use Core\Events\Concerns\VerifiesEvents;
use Modules\Payments\Events\RefundProcessed;
use Core\Services\Contracts\NotificationServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ProcessRefundNotification implements ShouldQueue
{
    use InteractsWithQueue, VerifiesEvents;

    public function handle(RefundProcessed $event): void
    {
        // Unsigned/forged/replayed money events never notify.
        if (!$this->verified($event, ['payments'])) {
            return;
        }

        $refund = $event->refund;

        // Refunds reference their payment; the payment carries the customer.
        $payment = \Modules\Payments\Entities\Payment::find($refund->payment_id);

        if (!$payment) {
            return;
        }

        app(NotificationServiceInterface::class)->notify(
            (string) $payment->user_id,
            'Refund processed',
            sprintf(
                'Your refund of %s %s for payment %s has been processed.',
                $payment->currency ?? \Core\Support\Currencies::default(),
                number_format((float) $refund->amount, 2),
                $payment->reference ?? $payment->id,
            ),
            'refund',
            (string) $refund->id,
        );
    }
}
