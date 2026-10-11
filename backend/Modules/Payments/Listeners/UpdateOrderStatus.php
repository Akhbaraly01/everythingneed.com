<?php

namespace Modules\Payments\Listeners;

use Modules\Payments\Events\PaymentCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class UpdateOrderStatus implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentCompleted $event): void
    {
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
