<?php

namespace Core\Services;

use App\Models\User;
use App\Models\UserRole;
use Core\Services\Contracts\PermissionServiceInterface;

class PermissionService extends BaseService implements PermissionServiceInterface
{
    public function assignRole(string $userId, string $role, ?string $categoryId = null): object
    {
        $existing = UserRole::where('user_id', $userId)
            ->where('role', $role)
            ->where('category_id', $categoryId)
            ->first();

        if ($existing) {
            return $existing;
        }

        $userRole = UserRole::create([
            'user_id' => $userId,
            'role' => $role,
            'category_id' => $categoryId,
        ]);

        return $userRole;
    }

    public function removeRole(string $userId, string $role): bool
    {
        return (bool) UserRole::where('user_id', $userId)
            ->where('role', $role)
            ->delete();
    }

    public function hasRole(string $userId, string $role): bool
    {
        return UserRole::where('user_id', $userId)
            ->where('role', $role)
            ->exists();
    }

    public function hasAnyRole(string $userId, array $roles): bool
    {
        return UserRole::where('user_id', $userId)
            ->whereIn('role', $roles)
            ->exists();
    }

    public function grantPermission(string $roleId, string $permission): object
    {
        $role = UserRole::findOrFail($roleId);

        $permissions = $role->permissions ?? [];
        if (!in_array($permission, $permissions)) {
            $permissions[] = $permission;
            $role->update(['permissions' => $permissions]);
        }

        return $role;
    }

    public function revokePermission(string $roleId, string $permission): bool
    {
        $role = UserRole::findOrFail($roleId);

        $permissions = $role->permissions ?? [];
        $permissions = array_filter($permissions, fn($p) => $p !== $permission);

        return $role->update(['permissions' => array_values($permissions)]);
    }

    public function primaryRole(string $userId): ?string
    {
        $value = \Illuminate\Support\Facades\DB::table('user_roles')
            ->where('user_id', $userId)
            ->value('role');

        return is_string($value) ? $value : null;
    }

    public function roleSummaries(array $canonicalRoles): array
    {
        $rows = \Illuminate\Support\Facades\DB::table('user_roles')
            ->select('role', \Illuminate\Support\Facades\DB::raw('count(*) as user_count'))
            ->groupBy('role')
            ->orderByDesc('user_count')
            ->get();

        $byRole = collect($rows)->keyBy('role');

        return collect($canonicalRoles)->map(fn ($role) => [
            'role'       => $role,
            'user_count' => (int) ($byRole[$role]->user_count ?? 0),
        ])->values()->all();
    }

    public function permissionMatrix(array $canonicalRoles): array
    {
        $rows = \Illuminate\Support\Facades\DB::table('role_permissions')
            ->where('state', 'granted')
            ->select('role', 'permission')
            ->orderBy('role')
            ->orderBy('permission')
            ->get()
            ->groupBy('role');

        return collect($canonicalRoles)->map(fn ($role) => [
            'role'        => $role,
            'permissions' => $rows->has($role)
                ? $rows[$role]->pluck('permission')->values()->all()
                : [],
        ])->values()->all();
    }

    public function deniedMatrix(array $canonicalRoles): array
    {
        $rows = \Illuminate\Support\Facades\DB::table('role_permissions')
            ->where('state', 'denied')
            ->select('role', 'permission')
            ->orderBy('role')
            ->orderBy('permission')
            ->get()
            ->groupBy('role');

        return collect($canonicalRoles)->map(fn ($role) => [
            'role'        => $role,
            'permissions' => $rows->has($role)
                ? $rows[$role]->pluck('permission')->values()->all()
                : [],
        ])->values()->all();
    }

    /**
     * W2 reversible grant: an existing denied row flips back to granted
     * (history kept); otherwise a granted row is inserted.
     */
    public function grantRolePermission(string $role, string $permission): void
    {
        $existing = \Illuminate\Support\Facades\DB::table('role_permissions')
            ->where('role', $role)
            ->where('permission', $permission)
            ->first();

        if ($existing) {
            \Illuminate\Support\Facades\DB::table('role_permissions')
                ->where('role', $role)
                ->where('permission', $permission)
                ->update(['state' => 'granted', 'updated_at' => now()]);
        } else {
            \Illuminate\Support\Facades\DB::table('role_permissions')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'role' => $role,
                'permission' => $permission,
                'state' => 'granted',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    public function rolePermissionExists(string $role, string $permission): bool
    {
        return \Illuminate\Support\Facades\DB::table('role_permissions')
            ->where('role', $role)
            ->where('permission', $permission)
            ->where('state', 'granted')
            ->exists();
    }

    /**
     * W2 reversible revoke: flips the row to denied (audit trail kept).
     * Revoking a never-granted permission is a no-op (no deny-row noise).
     */
    public function revokeRolePermission(string $role, string $permission): void
    {
        \Illuminate\Support\Facades\DB::table('role_permissions')
            ->where('role', $role)
            ->where('permission', $permission)
            ->update(['state' => 'denied', 'updated_at' => now()]);

        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    /**
     * W2 reversible grant: an existing denied row flips back to granted.
     */
    public function grantUserPermission(string $userId, string $permission, ?string $grantedBy = null, ?string $note = null): void
    {
        $exists = \Illuminate\Support\Facades\DB::table('user_permissions')
            ->where('user_id', $userId)
            ->where('permission', $permission)
            ->exists();

        if ($exists) {
            \Illuminate\Support\Facades\DB::table('user_permissions')
                ->where('user_id', $userId)
                ->where('permission', $permission)
                ->update([
                    'state' => 'granted',
                    'granted_by' => $grantedBy,
                    'note' => $note,
                    'updated_at' => now(),
                ]);
        } else {
            \Illuminate\Support\Facades\DB::table('user_permissions')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => $userId,
                'permission' => $permission,
                'state' => 'granted',
                'granted_by' => $grantedBy,
                'note' => $note,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        \Illuminate\Support\Facades\Cache::forget("user.permissions.{$userId}");
    }

    /**
     * W2 reversible revoke: flips the row to denied (audit trail kept).
     */
    public function revokeUserPermission(string $userId, string $permission): void
    {
        \Illuminate\Support\Facades\DB::table('user_permissions')
            ->where('user_id', $userId)
            ->where('permission', $permission)
            ->update(['state' => 'denied', 'updated_at' => now()]);

        \Illuminate\Support\Facades\Cache::forget("user.permissions.{$userId}");
    }

    public function userPermissionExists(string $userId, string $permission): bool
    {
        return \Illuminate\Support\Facades\DB::table('user_permissions')
            ->where('user_id', $userId)
            ->where('permission', $permission)
            ->where('state', 'granted')
            ->exists();
    }

    /**
     * @return list<string>
     */
    public function userPermissions(string $userId): array
    {
        return \Illuminate\Support\Facades\DB::table('user_permissions')
            ->where('user_id', $userId)
            ->where('state', 'granted')
            ->orderBy('permission')
            ->pluck('permission')
            ->all();
    }

    public function productCategoryScope(string $userId): ?string
    {
        $roles = UserRole::where('user_id', $userId)->pluck('role')->all();

        if (in_array('super_admin', $roles, true) || in_array('administrator', $roles, true)) {
            return null;
        }

        if (! in_array('marketplace_admin', $roles, true)) {
            // Non-marketplace viewers (e.g. moderator) keep the full queue.
            return null;
        }

        $categoryId = UserRole::where('user_id', $userId)
            ->where('role', 'marketplace_admin')
            ->value('category_id');

        if (! $categoryId) {
            // Unassigned scope: fail closed to an empty result set.
            return '__no_category_assigned__';
        }

        $categoryName = \Illuminate\Support\Facades\DB::table('categories')
            ->where('id', $categoryId)
            ->value('name');

        return $categoryName === null ? '__no_category_assigned__' : (string) $categoryName;
    }

    /**
     * ID-based category scope for category-tree management (master-plan T).
     *
     * Returns null for globally-privileged roles (no restriction), the
     * assigned category UUID for scoped marketplace admins, or the
     * '__no_category_assigned__' sentinel (deny) when unassigned.
     */
    public function managedCategoryId(string $userId): ?string
    {
        $roles = UserRole::where('user_id', $userId)->pluck('role')->all();

        // Global category managers (granted categories.* by design).
        if (count(array_intersect($roles, ['super_admin', 'administrator', 'category_admin', 'platform_ops'])) > 0) {
            return null;
        }

        if (! in_array('marketplace_admin', $roles, true)) {
            return '__no_category_assigned__';
        }

        $categoryId = UserRole::where('user_id', $userId)
            ->where('role', 'marketplace_admin')
            ->value('category_id');

        if (! $categoryId) {
            return '__no_category_assigned__';
        }

        $exists = \Illuminate\Support\Facades\DB::table('categories')
            ->where('id', $categoryId)
            ->exists();

        return $exists ? (string) $categoryId : '__no_category_assigned__';
    }

    /**
     * True when $categoryId equals the scope root or descends from it.
     */
    public function withinManagedScope(string $categoryId, ?string $scopeRootId): bool
    {
        if ($scopeRootId === null) {
            return true;
        }

        if ($scopeRootId === '__no_category_assigned__') {
            return false;
        }

        $cursor = $categoryId;
        $guard = 0;
        while ($cursor !== null && $guard++ < 100) {
            if ($cursor === $scopeRootId) {
                return true;
            }
            $cursor = \Illuminate\Support\Facades\DB::table('categories')
                ->where('id', $cursor)
                ->value('parent_id');
            $cursor = $cursor !== null ? (string) $cursor : null;
        }

        return false;
    }

    public function setUserRole(string $userId, string $role): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($userId, $role) {
            \Illuminate\Support\Facades\DB::table('user_roles')->where('user_id', $userId)->delete();
            \Illuminate\Support\Facades\DB::table('user_roles')->insert([
                'id'         => (string) \Illuminate\Support\Str::uuid(),
                'user_id'    => $userId,
                'role'       => $role,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }
}
