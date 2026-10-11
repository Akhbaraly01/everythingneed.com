<?php

namespace Modules\Payments\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'method' => $this->method,
            'reference' => $this->reference,
            'purpose' => $this->purpose,
            'provider' => $this->provider,
            'refunds' => $this->refunds->map(fn($refund) => [
                'id' => $refund->id,
                'amount' => $refund->amount,
                'status' => $refund->status,
                'method' => $refund->method,
                'reason' => $refund->reason,
                'requested_at' => $refund->requested_at,
                'reviewed_at' => $refund->reviewed_at,
                'rejection_reason' => $refund->rejection_reason,
                'created_at' => $refund->created_at,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
