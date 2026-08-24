<?php

namespace Modules\Payments\Listeners;

use Modules\Payments\Events\RefundProcessed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ProcessRefundNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(RefundProcessed $event): void
    {
        // Send refund confirmation to user
        // Update order status if needed
    }
}
