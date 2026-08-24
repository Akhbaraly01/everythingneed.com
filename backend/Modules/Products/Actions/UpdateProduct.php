<?php

namespace Modules\Products\Actions;

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

        $product->update($data);

        return $product->fresh();
    }
}
