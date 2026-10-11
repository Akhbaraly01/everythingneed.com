<?php

namespace Core\Services\Contracts;

interface AuditServiceInterface
{
    public function log(array $data): void;
    public function getEntityHistory(string $entityType, string $entityId, int $limit = 50): array;
    public function getActorHistory(string $actorId, int $limit = 50): array;

    /**
     * Paginated, filterable audit trail joined with the actor's identity.
     *
     * @return array{data: array, meta: array{total: int, page: int, per_page: int}}
     */
    public function paginate(array $filters = []): array;
}
