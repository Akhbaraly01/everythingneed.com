<?php

namespace Modules\Orders\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Orders\Entities\Order;

class OrderPlaced
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Order $order
    ) {}
}
