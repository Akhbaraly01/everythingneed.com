<?php

namespace Modules\Products\Actions;

use Modules\Products\Entities\Product;
use Core\Exceptions\NotFoundException;

class UpdateStock
{
    public function execute(string $productId, int $quantity): object
    {
        $product = Product::find($productId);

        if (!$product) {
            throw new NotFoundException('Product', $productId);
        }

        $product->update(['stock_quantity' => $quantity]);

        return $product->fresh();
    }
}
