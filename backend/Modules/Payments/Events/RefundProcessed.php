<?php

namespace Modules\Payments\Events;

use Core\Events\Concerns\SignsDispatch;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Payments\Entities\Refund;

class RefundProcessed
{
    use Dispatchable, SerializesModels, SignsDispatch;

    public function __construct(
        public Refund $refund
    ) {
        $this->sign('payments');
    }

    public function signatureClaims(): array
    {
        return [
            'refund_id' => $this->refund->id ?? '',
            'status' => $this->refund->status ?? '',
        ];
    }
}
