<?php
namespace Modules\Payments\Repositories;

use Core\Repositories\Repository;

interface PaymentRepository extends Repository
{
    public function findByUserId(string $userId, array $params = []): object;
    public function findByOrderId(string $orderId): ?object;
    public function findByReference(string $reference): ?object;
    public function findByStatus(string $status, array $params = []): object;
    public function updateStatus(string $id, string $status): object;
}
