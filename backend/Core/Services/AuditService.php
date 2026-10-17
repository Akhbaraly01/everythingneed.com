<?php

namespace Core\Services;

use App\Models\AuditLog;
use Core\Support\AuditChain;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Support\Facades\DB;

class AuditService extends BaseService implements AuditServiceInterface
{
    public function log(array $data): void
    {
        // performed_by is a UUID column (post-migration) and NOT NULL-safe:
        // non-UUID / missing actors fall back to the zero UUID so a failed
        // audit insert can never abort an open money transaction.
        $actor = $data['performed_by'] ?? null;
        if (!is_string($actor) || !preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $actor)) {
            $actor = '00000000-0000-0000-0000-000000000000';
        }

        // Second precision: the timestamp column stores no microseconds, and
        // the hash must be computed over exactly what is persisted.
        $createdAt = now()->toDateTimeString();

        $fields = [
            'action' => $data['action'],
            'entity_type' => $data['entity_type'],
            'entity_id' => (string) $data['entity_id'],
            'performed_by' => $actor,
            'ip_address' => $data['ip_address'] ?? $this->currentIp(),
            'old_values' => $data['old_values'] ?? null,
            'new_values' => $data['new_values'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'created_at' => $createdAt,
        ];

        \Illuminate\Support\Facades\DB::transaction(function () use ($fields) {
            // Lock the chain tip so concurrent writers cannot fork it.
            $tip = DB::table('audit_logs')
                ->orderByDesc('sequence')
                ->lockForUpdate()
                ->first(['sequence', 'hash']);

            $prev = $tip->hash ?? AuditChain::GENESIS;
            $hash = AuditChain::hash($fields, $prev);

            AuditLog::create($fields + [
                'prev_hash' => $prev === AuditChain::GENESIS ? null : $prev,
                'hash' => $hash,
            ]);
        });
    }

    /** Request IP when an HTTP context exists; null in console/queue. */
    private function currentIp(): ?string
    {
        try {
            // Feature tests run in the console but always have a request.
            if (app()->runningInConsole() && !app()->runningUnitTests()) {
                return null;
            }
            $ip = request()->ip();

            return is_string($ip) && $ip !== '' ? $ip : null;
        } catch (\Throwable) {
            return null;
        }
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

    public function paginate(array $filters = []): array
    {
        $query = \Illuminate\Support\Facades\DB::table('audit_logs as al')
            ->leftJoin('users as u', 'u.id', '=', 'al.performed_by')
            ->select([
                'al.id', 'al.action', 'al.entity_type', 'al.entity_id',
                'al.ip_address', 'al.old_values', 'al.new_values', 'al.metadata', 'al.created_at',
                'u.email as performed_by_email', 'u.name as performed_by_name',
            ]);

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('al.new_values', 'like', $term)
                    ->orWhere('al.old_values', 'like', $term)
                    ->orWhere('u.email', 'like', $term)
                    ->orWhere('al.entity_id', 'like', $term);
            });
        }

        if (! empty($filters['action'])) {
            $query->where('al.action', $filters['action']);
        }

        if (! empty($filters['entity_type'])) {
            $query->where('al.entity_type', 'like', $filters['entity_type']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('al.created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('al.created_at', '<=', $filters['date_to']);
        }

        $perPage = (int) ($filters['per_page'] ?? 25);
        $page    = (int) ($filters['page'] ?? 1);
        $total   = (clone $query)->count();
        $logs    = $query->orderByDesc('al.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        return [
            'data' => $logs,
            'meta' => ['total' => $total, 'page' => $page, 'per_page' => $perPage],
        ];
    }
}
