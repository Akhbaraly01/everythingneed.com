<?php

namespace Core\Services;

use App\Models\AuditLog;
use Core\Services\Contracts\AuditServiceInterface;

class AuditService extends BaseService implements AuditServiceInterface
{
    public function log(array $data): void
    {
        AuditLog::create([
            'action' => $data['action'],
            'entity_type' => $data['entity_type'],
            'entity_id' => $data['entity_id'],
            'performed_by' => $data['performed_by'] ?? null,
            'old_values' => $data['old_values'] ?? null,
            'new_values' => $data['new_values'] ?? null,
            'created_at' => now(),
        ]);
    }

    public function getEntityHistory(string $entityType, string $entityId, int $limit = 50): array
    {
        return AuditLog::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getActorHistory(string $actorId, int $limit = 50): array
    {
        return AuditLog::where('performed_by', $actorId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
