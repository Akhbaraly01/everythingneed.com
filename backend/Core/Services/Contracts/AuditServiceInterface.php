<?php

namespace Core\Services\Contracts;

interface AuditServiceInterface
{
    public function log(array $data): void;
    public function getEntityHistory(string $entityType, string $entityId, int $limit = 50): array;
    public function getActorHistory(string $actorId, int $limit = 50): array;
}
