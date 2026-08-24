<?php
namespace Modules\Pharmacy\Repositories;

use Core\Repositories\Repository;

interface MedicineRepository extends Repository
{
    public function findByCategory(string $category, array $params = []): object;
    public function findPrescriptionRequired(array $params = []): object;
    public function searchByName(string $name, array $params = []): object;
    public function updateStock(string $id, int $quantity): object;
}
