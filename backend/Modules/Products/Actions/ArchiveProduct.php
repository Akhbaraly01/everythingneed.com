<?php

namespace Modules\Products\Actions;

use Modules\Products\Entities\Product;
use Core\Exceptions\NotFoundException;

class ArchiveProduct
{
    public function execute(string $productId): object
    {
        $product = Product::find($productId);

        if (!$product) {
            throw new NotFoundException('Product', $productId);
        }

        $product->update(['is_active' => false]);

        return $product->fresh();
    }
}
