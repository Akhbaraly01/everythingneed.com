<?php
namespace Modules\Messaging\Repositories;

use Core\Repositories\Repository;

interface TicketRepository extends Repository
{
    public function findByUserId(string $userId, array $params = []): object;
    public function findByTicketNumber(string $ticketNumber): ?object;
    public function findByStatus(string $status, array $params = []): object;
    public function findByPriority(string $priority, array $params = []): object;
    public function updateStatus(string $id, string $status): object;
    public function assignToDepartment(string $id, string $departmentId): object;
}
