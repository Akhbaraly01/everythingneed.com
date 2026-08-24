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
            'refunds' => $this->refunds->map(fn($refund) => [
                'id' => $refund->id,
                'amount' => $refund->amount,
                'status' => $refund->status,
                'created_at' => $refund->created_at,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
