<?php

namespace Modules\Payments\Events;

use Core\Events\Concerns\SignsDispatch;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Payments\Entities\Payment;

class PaymentCompleted
{
    use Dispatchable, SerializesModels, SignsDispatch;

    public function __construct(
        public Payment $payment
    ) {
        $this->sign('payments');
    }

    public function signatureClaims(): array
    {
        return [
            'payment_id' => $this->payment->id ?? '',
            'status' => $this->payment->status ?? '',
        ];
    }
}
