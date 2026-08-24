<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * AdminSettingsController
 *
 * Manages system-wide settings and feature flags stored in the database.
 * All routes require auth:sanctum + manageSettings gate (super_admin only).
 */
class AdminSettingsController extends Controller
{
    private const CACHE_KEY_SETTINGS = 'admin_system_settings';
    private const CACHE_KEY_FLAGS    = 'admin_feature_flags';
    private const CACHE_TTL          = 300; // 5 minutes

    /**
     * Returns all system settings.
     *
     * GET /api/admin/settings
     */
    public function index(): JsonResponse
    {
        $settings = Cache::remember(self::CACHE_KEY_SETTINGS, self::CACHE_TTL, function () {
            $rows = DB::table('system_settings')->get();

            // If the table doesn't exist yet, return safe defaults
            return $rows->mapWithKeys(fn ($row) => [$row->key => $row->value])->toArray();
        });

        return response()->json(['data' => $settings]);
    }

    /**
     * Updates one or more system settings.
     *
     * PUT /api/admin/settings
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings'             => ['required', 'array'],
            'settings.*.key'       => ['required', 'string', 'max:100'],
            'settings.*.value'     => ['present'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['settings'] as $item) {
                DB::table('system_settings')->updateOrInsert(
                    ['key' => $item['key']],
                    [
                        'value'      => is_array($item['value']) ? json_encode($item['value']) : (string) $item['value'],
                        'updated_by' => auth()->id(),
                        'updated_at' => now(),
                    ]
                );
            }
        });

        Cache::forget(self::CACHE_KEY_SETTINGS);

        $this->logAudit('update', 'settings', 'system', 'Updated ' . count($validated['settings']) . ' settings');

        return response()->json(['message' => 'Settings updated successfully']);
    }

    /**
     * Returns all feature flags.
     *
     * GET /api/admin/feature-flags
     */
    public function featureFlags(): JsonResponse
    {
        $flags = Cache::remember(self::CACHE_KEY_FLAGS, self::CACHE_TTL, function () {
            return DB::table('feature_flags')
                ->select(['id', 'key', 'name', 'description', 'is_enabled as enabled', 'default_value', 'conditions', 'created_at', 'updated_at'])
                ->get();
        });

        return response()->json(['data' => $flags]);
    }

    /**
     * Toggles a single feature flag.
     *
     * PUT /api/admin/feature-flags/{key}
     */
    public function toggleFlag(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        $affected = DB::table('feature_flags')
            ->where('key', $key)
            ->update([
                'is_enabled' => $validated['enabled'],
                'updated_at' => now(),
            ]);

        if (! $affected) {
            // Auto-create if not found
            DB::table('feature_flags')->insert([
                'id'         => Str::uuid()->toString(),
                'key'        => $key,
                'name'       => Str::title(str_replace('_', ' ', $key)),
                'is_enabled' => $validated['enabled'],
                'default_value' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Cache::forget(self::CACHE_KEY_FLAGS);

        $state = $validated['enabled'] ? 'enabled' : 'disabled';
        $this->logAudit('update', 'feature_flag', $key, "Feature flag '{$key}' {$state}");

        return response()->json(['message' => "Feature flag '{$key}' {$state}"]);
    }

    /**
     * Writes an audit log entry.
     */
    private function logAudit(string $action, string $entityType, string $entityId, string $details): void
    {
        try {
            DB::table('audit_logs')->insert([
                'id'           => Str::uuid()->toString(),
                'action'       => $action,
                'entity_type'  => $entityType,
                'entity_id'    => $entityId,
                'new_values'   => json_encode(['details' => $details]),
                'performed_by' => auth()->id(),
                'created_at'   => now(),
            ]);
        } catch (Throwable) {
            // Never let audit failures break responses
        }
    }
}
