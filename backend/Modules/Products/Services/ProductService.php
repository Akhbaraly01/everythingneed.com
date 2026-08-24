<?php

namespace Modules\Products\Services;

use Modules\Products\Actions\CreateProduct;
use Modules\Products\Actions\UpdateProduct;
use Modules\Products\Actions\ArchiveProduct;
use Modules\Products\Actions\UpdateStock;
use Modules\Products\Entities\Product;

class ProductService
{
    public function __construct(
        private CreateProduct $createProduct,
        private UpdateProduct $updateProduct,
        private ArchiveProduct $archiveProduct,
        private UpdateStock $updateStock,
    ) {}

    public function create(array $data): object
    {
        return $this->createProduct->execute($data);
    }

    public function update(string $productId, array $data): object
    {
        return $this->updateProduct->execute($productId, $data);
    }

    public function archive(string $productId): object
    {
        return $this->archiveProduct->execute($productId);
    }

    public function updateStock(string $productId, int $quantity): object
    {
        return $this->updateStock->execute($productId, $quantity);
    }

    public function getProduct(string $productId): ?Product
    {
        return Product::with(['vendor', 'reviews'])->find($productId);
    }

    public function getProducts(array $filters = [], int $page = 1, int $perPage = 15): object
    {
        $query = Product::with(['vendor']);

        if (!empty($filters['search'])) {
            $query->where('name', 'ilike', "%{$filters['search']}%");
        }

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['vendor_id'])) {
            $query->where('vendor_id', $filters['vendor_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function getActiveProducts(int $page = 1, int $perPage = 15): object
    {
        return $this->getProducts(['is_active' => true], $page, $perPage);
    }
}
