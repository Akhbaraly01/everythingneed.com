<?php

namespace Modules\Orders\Listeners;

use Modules\Orders\Events\OrderCancelled;
use Core\Services\Contracts\NotificationServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ProcessOrderCancellation implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(OrderCancelled $event): void
    {
        $order = $event->order;

        // Per-vendor legs already restore their own stock on cancellation;
        // this listener closes the loop for the customer.
        app(NotificationServiceInterface::class)->notify(
            (string) $order->user_id,
            'Order cancelled',
            "Your order {$order->order_number} has been cancelled.",
            'order',
            (string) $order->id,
        );
    }
}
