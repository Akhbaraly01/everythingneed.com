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
            'slug' => $this->slug,
            'sku' => $this->sku,
            'description' => $this->description,
            'category' => $this->category,
            'subcategory' => $this->subcategory,
            'price' => $this->price,
            'compare_price' => $this->compare_price,
            'currency' => $this->currency ?? \Core\Support\Currencies::default(),
            'tax_rate' => $this->tax_rate ?? 0,
            'discount_percent' => $this->discount_percent ?? 0,
            'featured' => (bool) ($this->featured ?? false),
            'publication_state' => $this->publication_state ?? 'published',
            'specifications' => $this->specifications,
            'attributes' => $this->attributes,
            'shipping' => $this->shipping,
            'image_url' => $this->image_url,
            'images' => $this->images,
            'video_url' => $this->video_url,
            'production_video_url' => $this->production_video_url,
            'stock_quantity' => $this->stock_quantity,
            'is_active' => $this->is_active,
            'approved_at' => $this->approved_at,
            'rating' => $this->rating,
            'reviews_count' => $this->reviews_count,
            'vendor' => [
                'id' => $this->vendor?->id,
                'store_name' => $this->vendor?->store_name,
            ],
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'sku' => $v->sku,
                'price' => $v->price,
                'stock_quantity' => $v->stock_quantity,
                'attributes' => $v->attributes,
                'is_active' => $v->is_active,
            ])->values()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
