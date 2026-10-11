<?php

namespace Modules\Products\Actions;

use Illuminate\Support\Facades\DB;
use Modules\Products\Entities\Product;
use Core\Exceptions\NotFoundException;

class UpdateProduct
{
    public function execute(string $productId, array $data): object
    {
        $product = Product::find($productId);

        if (!$product) {
            throw new NotFoundException('Product', $productId);
        }

        return DB::transaction(function () use ($product, $data) {
            $variants = $data['variants'] ?? null;
            unset($data['variants']);

            $product->update($data);

            if (is_array($variants)) {
                // Full replacement: drop what is not present in the payload.
                $product->variants()->delete();
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

            return $product->fresh(['variants']);
        });
    }
}
