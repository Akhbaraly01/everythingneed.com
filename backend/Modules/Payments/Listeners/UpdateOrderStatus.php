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

        if ($payment->order) {
            $payment->order->update(['status' => 'confirmed']);
        }
    }
}
