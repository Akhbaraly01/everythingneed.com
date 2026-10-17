<?php

namespace Core\Support;

/**
 * Hash-chain math for the tamper-evident audit trail (Phase 4).
 *
 * Each row commits to its full content plus the previous row's hash, keyed
 * by HMAC-SHA256(APP_KEY): editing, deleting, or reordering any row breaks
 * every later link. Shared by AuditService (write path) and the
 * audit:verify-chain command (read path) so both sides canonicalize
 * identically.
 */
class AuditChain
{
    public const GENESIS = 'GENESIS';

    /**
     * @param array{action: mixed, entity_type: mixed, entity_id: mixed, performed_by: mixed, old_values: mixed, new_values: mixed, metadata: mixed, ip_address: mixed, created_at: mixed} $fields
     */
    public static function hash(array $fields, ?string $prevHash): string
    {
        $canonical = json_encode([
            $fields['action'] ?? null,
            $fields['entity_type'] ?? null,
            (string) ($fields['entity_id'] ?? ''),
            (string) ($fields['performed_by'] ?? ''),
            self::normalizeJson($fields['old_values'] ?? null),
            self::normalizeJson($fields['new_values'] ?? null),
            self::normalizeJson($fields['metadata'] ?? null),
            $fields['ip_address'] ?? null,
            self::normalizeTime($fields['created_at'] ?? null),
            $prevHash ?? self::GENESIS,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return hash_hmac('sha256', (string) $canonical, (string) config('app.key'));
    }

    private static function normalizeJson(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $value = is_array($decoded) ? $decoded : $value;
        }

        return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private static function normalizeTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return \Carbon\Carbon::parse($value)->toIso8601String();
        } catch (\Throwable) {
            return (string) $value;
        }
    }
}
