<?php

namespace Modules\Settings\Services;

use Core\Services\BaseService;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\SettingsQueryInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SettingsQueryService extends BaseService implements SettingsQueryInterface
{
    private const CACHE_KEY_SETTINGS = 'admin_system_settings';
    private const CACHE_KEY_FLAGS    = 'admin_feature_flags';
    private const CACHE_TTL          = 300; // 5 minutes

    public function __construct(private AuditServiceInterface $audit)
    {
    }

    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY_SETTINGS, self::CACHE_TTL, function () {
            return DB::table('system_settings')
                ->get()
                ->mapWithKeys(fn ($row) => [$row->key => $row->value])
                ->toArray();
        });
    }

    public function updateMany(array $items, ?string $actorId): void
    {
        // $actorId must be captured: PHP closures do not inherit scope.
        // Inserts must also supply the uuid PK (updateOrInsert had no id →
        // not-null violation; new settings could never be created).
        $previous = DB::table('system_settings')
            ->whereIn('key', array_column($items, 'key'))
            ->pluck('value', 'key')
            ->all();

        DB::transaction(function () use ($items, $actorId) {
            foreach ($items as $item) {
                $value = is_array($item['value']) ? json_encode($item['value']) : (string) $item['value'];
                $exists = DB::table('system_settings')->where('key', $item['key'])->exists();

                if ($exists) {
                    DB::table('system_settings')->where('key', $item['key'])->update([
                        'value' => $value,
                        'updated_by' => $actorId,
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::table('system_settings')->insert([
                        'id' => (string) Str::uuid(),
                        'key' => $item['key'],
                        'value' => $value,
                        'updated_by' => $actorId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });

        Cache::forget(self::CACHE_KEY_SETTINGS);

        // Per-key before/after rows (spec §66: configuration changes with
        // before/after values). Unchanged keys are not audited.
        foreach ($items as $item) {
            $newValue = is_array($item['value']) ? json_encode($item['value']) : (string) $item['value'];
            $oldValue = $previous[$item['key']] ?? null;

            if ($oldValue !== null && (string) $oldValue === $newValue) {
                continue;
            }

            $this->auditQuietly('update', 'settings', (string) $item['key'], "Updated setting '{$item['key']}'", $actorId, [
                'value' => $oldValue,
            ], [
                'value' => $newValue,
            ]);
        }
    }

    public function delete(string $key, ?string $actorId): string
    {
        $previous = DB::table('system_settings')->where('key', $key)->value('value');

        $affected = DB::table('system_settings')->where('key', $key)->delete();

        if (! $affected) {
            return 'missing';
        }

        Cache::forget(self::CACHE_KEY_SETTINGS);

        $this->auditQuietly('delete', 'settings', $key, "Deleted system setting '{$key}'", $actorId, [
            'value' => $previous,
        ]);

        return 'ok';
    }

    public function featureFlags(): array
    {
        return Cache::remember(self::CACHE_KEY_FLAGS, self::CACHE_TTL, function () {
            return DB::table('feature_flags')
                ->select(['id', 'key', 'name', 'description', 'is_enabled as enabled', 'default_value', 'conditions', 'created_at', 'updated_at'])
                ->get()
                ->toArray(); // contract is array — returning the Collection 500'd the endpoint
        });
    }

    public function toggleFlag(string $key, bool $enabled, ?string $actorId): string
    {
        $affected = DB::table('feature_flags')
            ->where('key', $key)
            ->update([
                'is_enabled' => $enabled,
                'updated_at' => now(),
            ]);

        if (! $affected) {
            // Unknown keys are rejected: flags are seeded, not invented by
            // a stray toggle (previously this silently auto-created rows).
            return 'missing';
        }

        Cache::forget(self::CACHE_KEY_FLAGS);

        $state = $enabled ? 'enabled' : 'disabled';
        $this->auditQuietly('update', 'feature_flag', $key, "Feature flag '{$key}' {$state}", $actorId);

        return $state;
    }

    /**
     * @param  array<string, mixed>|null  $old
     * @param  array<string, mixed>|null  $new
     */
    private function auditQuietly(string $action, string $entityType, string $entityId, string $details, ?string $actorId, ?array $old = null, ?array $new = null): void
    {
        try {
            $this->audit->log([
                'action'       => $action,
                'entity_type'  => $entityType,
                'entity_id'    => $entityId,
                'performed_by' => $actorId,
                'old_values'   => $old,
                'new_values'   => $new ?? ['details' => $details],
            ]);
        } catch (\Throwable) {
            // Never let audit failures break responses.
        }
    }
}
