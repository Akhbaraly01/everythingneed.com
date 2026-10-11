<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * W1 Batch A — renames two role values across deployed data:
 *
 *   category_admin  -> marketplace_admin  (spec §9 roster)
 *   support_staff   -> support_agent      (spec §9 roster)
 *
 * Updates both user_roles.role and role_permissions.role, refreshes the
 * PostgreSQL column documentation from the canonical AppRole enum, and
 * flushes the RBAC cache so hasPermission/hasAnyRole see the new values.
 *
 * Code-side renames (AppRole, seeder MATRIX, routes, policies, landings)
 * ship in the same release; this migration keeps existing databases in step.
 */
return new class extends Migration
{
    /** @var array<string, string> */
    private const RENAME = [
        'category_admin' => 'marketplace_admin',
        'support_staff' => 'support_agent',
    ];

    public function up(): void
    {
        $this->rename();

        $this->refreshRoleDocumentation();

        Cache::forget('rbac.matrix');
    }

    public function down(): void
    {
        foreach (array_flip(self::RENAME) as $new => $old) {
            DB::table('user_roles')->where('role', $new)->update(['role' => $old]);
            DB::table('role_permissions')->where('role', $new)->update(['role' => $old]);
        }

        $this->refreshRoleDocumentation();

        Cache::forget('rbac.matrix');
    }

    private function rename(): void
    {
        foreach (self::RENAME as $old => $new) {
            DB::table('user_roles')->where('role', $old)->update(['role' => $new]);
            DB::table('role_permissions')->where('role', $old)->update(['role' => $new]);
        }
    }

    /**
     * Keep the column documentation in lockstep with AppRole::values()
     * (the 2026_01_01_000015 comment is a stale hand-written snapshot).
     */
    private function refreshRoleDocumentation(): void
    {
        $roles = implode(', ', \Core\Enums\AppRole::values());

        try {
            DB::statement("COMMENT ON COLUMN user_roles.role IS 'Valid roles: {$roles}'");
        } catch (\Throwable) {
            // Non-postgres drivers / dropped table — documentation only.
        }
    }
};
