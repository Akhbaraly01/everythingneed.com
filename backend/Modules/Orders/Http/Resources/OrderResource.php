<?php

namespace Modules\Orders\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'delivery_address' => $this->delivery_address,
            'total_amount' => $this->total_amount,
            'status' => $this->status,
            'items' => $this->items->map(fn($item) => [
                'id' => $item->id,
                'medicine' => [
                    'id' => $item->medicine?->id,
                    'name' => $item->medicine?->name,
                ],
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
