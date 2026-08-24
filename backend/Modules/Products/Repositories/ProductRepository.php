<?php
namespace Modules\Products\Repositories;

use Core\Repositories\Repository;

interface ProductRepository extends Repository
{
    public function findByVendorId(string $vendorId, array $params = []): object;
    public function findActiveProducts(array $params = []): object;
    public function findByCategory(string $category, array $params = []): object;
    public function updateStock(string $id, int $quantity): object;
}
