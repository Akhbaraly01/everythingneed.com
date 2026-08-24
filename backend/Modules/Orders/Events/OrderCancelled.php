<?php

namespace Modules\Orders\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Orders\Entities\MedicineOrder;

class OrderCancelled
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public MedicineOrder $order
    ) {}
}
