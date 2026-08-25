<?php

namespace Modules\Orders\Listeners;

use Modules\Orders\Events\OrderPlaced;
use Modules\Orders\Mail\OrderConfirmationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendOrderConfirmation implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(OrderPlaced $event): void
    {
        $order = $event->order;

        // In-app notification
        app(\Core\Services\NotificationService::class)->notify(
            (string) $order->user_id,
            'Order confirmed',
            "Your order {$order->order_number} was placed successfully.",
            'order',
            (string) $order->id,
        );

        // Email receipt (log mailer in local dev)
        $email = \App\Models\User::where('id', $order->user_id)->value('email');

        if ($email) {
            Mail::to($email)->send(new OrderConfirmationMail(
                orderNumber: $order->order_number,
                total: (float) $order->total_amount,
            ));
        }
    }
}
