<?php
namespace Modules\Orders\Repositories;

use Core\Repositories\Repository;

interface OrderRepository extends Repository
{
    public function findByUserId(string $userId, array $params = []): object;
    public function findByOrderNumber(string $orderNumber): ?object;
    public function findByStatus(string $status, array $params = []): object;
    public function updateStatus(string $id, string $status): object;
}
