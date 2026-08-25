<?php

namespace Modules\Payments\Listeners;

use Modules\Payments\Events\RefundProcessed;
use Core\Services\Contracts\NotificationServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ProcessRefundNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(RefundProcessed $event): void
    {
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
                $payment->currency ?? 'USD',
                number_format((float) $refund->amount, 2),
                $payment->reference ?? $payment->id,
            ),
            'refund',
            (string) $refund->id,
        );
    }
}
