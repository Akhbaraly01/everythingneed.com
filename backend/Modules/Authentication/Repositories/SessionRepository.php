<?php
namespace Modules\Authentication\Repositories;

use Core\Repositories\Repository;

interface SessionRepository extends Repository
{
    public function findByToken(string $token): ?object;
    public function findByUserId(string $userId): array;
    public function deleteExpired(): int;
    public function deleteByToken(string $token): bool;
}