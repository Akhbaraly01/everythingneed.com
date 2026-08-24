<?php

namespace Modules\Payments\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Payments\Entities\Payment;

class PaymentCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Payment $payment
    ) {}
}
