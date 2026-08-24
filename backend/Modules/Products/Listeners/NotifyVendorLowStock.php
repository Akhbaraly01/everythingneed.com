<?php

namespace Modules\Products\Listeners;

use Modules\Products\Events\ProductStockLow;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyVendorLowStock implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(ProductStockLow $event): void
    {
        // Send low stock notification to vendor
    }
}
