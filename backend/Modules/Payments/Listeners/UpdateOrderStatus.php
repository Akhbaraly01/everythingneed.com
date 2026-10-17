<?php

namespace Modules\Payments\Listeners;

use Core\Events\Concerns\VerifiesEvents;
use Modules\Payments\Events\PaymentCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class UpdateOrderStatus implements ShouldQueue
{
    use InteractsWithQueue, VerifiesEvents;

    public function handle(PaymentCompleted $event): void
    {
        // Unsigned/forged/replayed money events never move order state.
        if (!$this->verified($event, ['payments'])) {
            return;
        }

        $payment = $event->payment;

        // Marketplace product orders own their status via ChargePayment
        // (pending → paid). Only nudge still-pending orders here, and never
        // write a status outside the Order enum (e.g. legacy 'confirmed').
        $order = $payment->order;
        if ($order && $order->status === \Modules\Orders\Entities\Order::STATUS_PENDING) {
            $order->update(['status' => \Modules\Orders\Entities\Order::STATUS_PAID]);
        }
    }
}
