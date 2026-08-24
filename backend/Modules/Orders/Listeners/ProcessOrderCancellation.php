<?php

namespace Modules\Orders\Listeners;

use Modules\Orders\Events\OrderCancelled;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ProcessOrderCancellation implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(OrderCancelled $event): void
    {
        // Process refund if applicable
        // Restore inventory
        // Notify vendor
    }
}
