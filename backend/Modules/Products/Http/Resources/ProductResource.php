<?php

namespace Modules\Products\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category,
            'subcategory' => $this->subcategory,
            'price' => $this->price,
            'compare_price' => $this->compare_price,
            'image_url' => $this->image_url,
            'images' => $this->images,
            'stock_quantity' => $this->stock_quantity,
            'is_active' => $this->is_active,
            'rating' => $this->rating,
            'reviews_count' => $this->reviews_count,
            'vendor' => [
                'id' => $this->vendor?->id,
                'store_name' => $this->vendor?->store_name,
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
