<?php

namespace Modules\Products\Actions;

use Illuminate\Support\Facades\DB;
use Modules\Products\Entities\Product;

class CreateProduct
{
    public function execute(array $data): object
    {
        return DB::transaction(function () use ($data) {
            $variants = $data['variants'] ?? null;
            unset($data['variants']);

            $product = Product::create($data);

            if (is_array($variants)) {
                $this->syncVariants($product, $variants);
            }

            return $product->fresh(['variants']);
        });
    }

    private function syncVariants(Product $product, array $variants): void
    {
        foreach ($variants as $variant) {
            $product->variants()->create([
                'name' => $variant['name'],
                'sku' => $variant['sku'] ?? null,
                'price' => $variant['price'],
                'stock_quantity' => $variant['stock_quantity'] ?? 0,
                'attributes' => $variant['attributes'] ?? null,
                'is_active' => $variant['is_active'] ?? true,
            ]);
        }
    }
}
