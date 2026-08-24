<?php

namespace Modules\Vendors\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class VendorResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'store_name' => $this->store_name,
            'category' => $this->category,
            'description' => $this->description,
            'is_verified' => $this->is_verified,
            'rating' => $this->rating,
            'products_count' => $this->products_count ?? $this->products->count(),
            'created_at' => $this->created_at,
        ];
    }
}
