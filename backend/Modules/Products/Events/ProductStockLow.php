<?php

namespace Modules\Products\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Products\Entities\Product;

class ProductStockLow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Product $product,
        public int $currentStock
    ) {}
}
