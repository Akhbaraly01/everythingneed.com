<?php

namespace Modules\Payments\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Payments\Entities\Refund;

class RefundProcessed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Refund $refund
    ) {}
}
