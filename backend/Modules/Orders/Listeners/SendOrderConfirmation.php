<?php

namespace Modules\Orders\Listeners;

use Modules\Orders\Events\OrderPlaced;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendOrderConfirmation implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(OrderPlaced $event): void
    {
        // Send confirmation email/notification to user
        // Update inventory
        // Notify vendor
    }
}
