<?php

namespace Modules\Products\Actions;

use Modules\Products\Entities\Product;
use Core\Exceptions\NotFoundException;

class CreateProduct
{
    public function execute(array $data): object
    {
        return Product::create($data);
    }
}
