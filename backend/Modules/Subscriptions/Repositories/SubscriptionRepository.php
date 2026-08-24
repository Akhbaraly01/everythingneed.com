<?php
namespace Modules\Subscriptions\Repositories;

use Core\Repositories\Repository;

interface SubscriptionRepository extends Repository
{
    public function findByUserId(string $userId, array $params = []): object;
    public function findActiveByUserId(string $userId): ?object;
    public function findByStatus(string $status, array $params = []): object;
    public function updateStatus(string $id, string $status): object;
    public function findExpiredSubscriptions(): object;
}
