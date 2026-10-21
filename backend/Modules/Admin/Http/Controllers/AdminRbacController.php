<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\PermissionServiceInterface;
use Core\Services\Contracts\RoleAssignmentInterface;
use Core\Services\Contracts\RoleRegistryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Admin\Http\Requests\AssignUserRoleRequest;
use Modules\Admin\Http\Requests\BulkRolePermissionRequest;
use Modules\Admin\Http\Requests\CreateCustomRoleRequest;
use Modules\Admin\Http\Requests\GrantPermissionRequest;
use Modules\Admin\Http\Requests\GrantUserPermissionRequest;
use Modules\Admin\Http\Requests\RevokePermissionRequest;

class AdminRbacController extends Controller
{
    // Canonical 40-role set — must stay equal to Core\Enums\AppRole::values()
    // (asserted by tests\Unit\Admin\CanonicalRolesTest).
    public const ROLES = [
        'super_admin', 'administrator', 'platform_ops', 'security_admin',
        'vendor_admin', 'moderator', 'support_agent', 'content_manager',
        'analytics_admin', 'finance_admin', 'healthcare_admin', 'learning_admin',
        'learning_reviewer',
        'customer_service', 'marketplace_admin', 'hotel_admin', 'food_admin',
        'transport_admin', 'agriculture_admin', 'building_admin', 'jobs_admin',
        'pharmacy_admin', 'orders_admin', 'wallet_admin', 'support_admin',
        'real_estate_admin', 'needs_admin', 'needs_viewer',
        'payout_reviewer', 'refund_agent', 'inventory_manager', 'cms_editor',
        'auditor', 'analyst',
        'kyc_reviewer', 'worker', 'user',
        // Spec A section 65 named admin roles.
        'category_admin', 'vendor_manager', 'content_admin',
    ];

    // Roles labelled "Core" in the console (flagship platform roles).
    // All canonical roles are protected (non-deletable); custom roles
    // created from the console are deletable.
    public const CORE_ROLES = ['super_admin', 'administrator', 'user'];

    public function __construct(
        private PermissionServiceInterface $permissions,
        private RoleAssignmentInterface $assignments,
        private \Core\Services\Contracts\ScopeResolverInterface $scopes,
        private \Core\Services\Contracts\AuditServiceInterface $audit,
        private RoleRegistryInterface $registry,
    ) {}

    public function roles(): JsonResponse
    {
        $roles = $this->registry->allIncludingRetired();
        $summaries = collect($this->permissions->roleSummaries($roles))->keyBy('role');

        return response()->json(['data' => collect($roles)->map(fn (string $role) => [
            'role'       => $role,
            'label'      => $this->registry->label($role),
            'user_count' => (int) ($summaries[$role]['user_count'] ?? 0),
            'is_core'    => in_array($role, self::CORE_ROLES, true),
            'is_custom'  => ! $this->registry->isCore($role),
            'is_retired' => $this->registry->isRetired($role),
        ])->values()->all()]);
    }

    public function permissions(): JsonResponse
    {
        // Single source of truth: PermissionSeeder::CATALOG (module.action).
        $grouped = [];
        foreach (\Database\Seeders\PermissionSeeder::CATALOG as $permission) {
            [$module, $action] = array_pad(explode('.', $permission, 2), 2, '');
            $grouped[$module][] = $action;
        }

        return response()->json(['data' => $grouped]);
    }

    /**
     * Effective role -> permission matrix from the database, plus the
     * denied-state rows (W2) so the console can offer one-click restore.
     * Covers canonical + custom roles with console metadata.
     */
    public function matrix(): JsonResponse
    {
        $roles = $this->registry->allIncludingRetired();
        $summaries = collect($this->permissions->roleSummaries($roles))->keyBy('role');

        $data = collect($this->permissions->permissionMatrix($roles))->map(fn (array $row) => [
            'role'        => $row['role'],
            'label'       => $this->registry->label($row['role']),
            'permissions' => $row['permissions'],
            'user_count'  => (int) ($summaries[$row['role']]['user_count'] ?? 0),
            'is_core'     => in_array($row['role'], self::CORE_ROLES, true),
            'is_custom'   => ! $this->registry->isCore($row['role']),
            'is_retired'  => $this->registry->isRetired($row['role']),
        ])->values()->all();

        return response()->json([
            'data' => $data,
            'denied' => $this->permissions->deniedMatrix($roles),
        ]);
    }

    /**
     * Grant a single granular permission to a role.
     */
    public function grant(GrantPermissionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $existed = $this->permissions->rolePermissionExists($validated['role'], $validated['permission']);

        $this->permissions->grantRolePermission($validated['role'], $validated['permission']);

        $this->auditChange('role_permission', "{$validated['role']}:{$validated['permission']}", [
            'old_values' => ['granted' => $existed],
            'new_values' => ['granted' => true, 'role' => $validated['role'], 'permission' => $validated['permission']],
        ], $request);

        return response()->json(['message' => "Granted {$validated['permission']} to {$validated['role']}"]);
    }

    /**
     * Revoke a single granular permission from a role.
     */
    public function revoke(RevokePermissionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $existed = $this->permissions->rolePermissionExists($validated['role'], $validated['permission']);

        $this->permissions->revokeRolePermission($validated['role'], $validated['permission']);

        $this->auditChange('role_permission', "{$validated['role']}:{$validated['permission']}", [
            'old_values' => ['granted' => $existed],
            'new_values' => ['granted' => false, 'role' => $validated['role'], 'permission' => $validated['permission']],
        ], $request);

        return response()->json(['message' => "Revoked {$validated['permission']} from {$validated['role']}"]);
    }

    /**
     * Bulk grant/revoke for one role in a single transaction (the role
     * card editor saves all chips at once; one audit row, one cache flush).
     */
    public function bulkUpdate(BulkRolePermissionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $grant = $validated['grant'] ?? [];
        $revoke = $validated['revoke'] ?? [];

        $this->permissions->bulkUpdateRolePermissions($validated['role'], $grant, $revoke);

        $this->auditChange('role_permission', $validated['role'], [
            'new_values' => [
                'granted' => array_values($grant),
                'revoked' => array_values($revoke),
            ],
        ], $request);

        return response()->json([
            'message' => "Updated {$validated['role']} (".count($grant).' granted, '.count($revoke).' revoked)',
        ]);
    }

    /**
     * Creates a custom role with its initial permission selection.
     */
    public function createRole(CreateCustomRoleRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $slug = $this->registry->create(
            $validated['name'],
            $validated['slug'] ?? null,
            $validated['description'] ?? null,
            $validated['permissions'] ?? [],
            $request->user()?->id,
        );

        $this->auditChange('custom_role', $slug, [
            'new_values' => [
                'name' => $validated['name'],
                'slug' => $slug,
                'permissions' => $validated['permissions'] ?? [],
            ],
        ], $request);

        return response()->json(['message' => "Role {$slug} created", 'slug' => $slug], 201);
    }

    /**
     * Deletes a custom role. Built-in roles are protected: only a super
     * admin may take one out of service (it is then hidden from the
     * console and every role picker, and can be restored). When users
     * still hold the role, deletion is blocked unless reassign_to names
     * the role that should receive them, so no assignment is orphaned.
     */
    public function deleteRole(Request $request, string $slug): JsonResponse
    {
        // Built-in roles are part of the platform contract: they can never
        // be deleted, not even by a super admin (the roster, the permission
        // matrix and every gated surface depend on them). Only custom
        // roles can be removed.
        if ($this->registry->isCore($slug)) {
            return response()->json([
                'message' => 'Built-in roles cannot be deleted.',
            ], 422);
        }

        if (! in_array($slug, $this->registry->custom(), true)) {
            return response()->json(['message' => 'Role not found'], 404);
        }

        $validated = $request->validate([
            'reassign_to' => ['nullable', 'string', 'max:100'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $reassignTo = $validated['reassign_to'] ?? null;
        $holders = $this->registry->holderCount($slug);

        if ($holders > 0 && $reassignTo === null) {
            return response()->json([
                'message' => "Reassign the {$holders} user(s) holding this role before deleting it.",
                'holders' => $holders,
            ], 422);
        }

        if ($reassignTo !== null && ($reassignTo === $slug || ! $this->registry->exists($reassignTo))) {
            return response()->json([
                'message' => 'Choose a different existing role to reassign the holders to.',
            ], 422);
        }

        DB::transaction(function () use ($slug, $reassignTo, $request, $validated) {
            if ($reassignTo !== null) {
                $alreadyHoldsTarget = DB::table('user_roles')
                    ->where('role', $reassignTo)
                    ->select('user_id');

                DB::table('user_roles')
                    ->where('role', $slug)
                    ->whereIn('user_id', $alreadyHoldsTarget)
                    ->delete();

                DB::table('user_roles')
                    ->where('role', $slug)
                    ->update(['role' => $reassignTo, 'updated_at' => now()]);
            }

            $this->registry->delete($slug);
        });

        $this->auditChange('custom_role', $slug, [
            'old_values' => $reassignTo !== null ? ['holders' => $holders] : null,
            'new_values' => [
                'deleted' => true,
                ...($reassignTo !== null
                    ? ['reassigned_to' => $reassignTo, 'reassigned_count' => $holders]
                    : []),
            ],
        ], $request);

        return response()->json([
            'message' => "Role {$slug} deleted",
            'retired' => false,
        ]);
    }

    /**
     * Brings a retired built-in role back into service and re-seeds its
     * default permissions. Super admin only.
     */
    public function restoreRole(Request $request, string $role): JsonResponse
    {
        if (! $this->isSuperAdmin($request)) {
            return response()->json([
                'message' => 'Only a super admin can restore a built-in role.',
            ], 422);
        }

        if (! $this->registry->isRetired($role)) {
            return response()->json(['message' => 'Role is not retired'], 422);
        }

        $this->registry->restore($role);

        $this->auditChange('custom_role', $role, [
            'new_values' => ['restored' => true],
        ], $request);

        return response()->json(['message' => "Role {$role} restored"]);
    }

    /** Super admin = the platform owner role. */
    private function isSuperAdmin(Request $request): bool
    {
        $user = $request->user();

        return $user !== null && $user->hasRole('super_admin');
    }

    /**
     * Restores a canonical role's seeded default permission set.
     */
    public function resetRole(Request $request, string $role): JsonResponse
    {
        if (! \Database\Seeders\PermissionSeeder::isDefaultRole($role)) {
            return response()->json(['message' => 'Only built-in roles can be reset to their defaults.'], 422);
        }

        $before = count($this->permissions->permissionMatrix([$role])[0]['permissions'] ?? []);

        $this->permissions->resetRolePermissions($role);

        $this->auditChange('role_permission', $role, [
            'old_values' => ['granted_count' => $before],
            'new_values' => [
                'granted_count' => count(\Database\Seeders\PermissionSeeder::defaultsFor($role)),
                'reset' => true,
            ],
        ], $request);

        return response()->json(['message' => "Role {$role} reset to defaults"]);
    }

    public function updateRole(AssignUserRoleRequest $request): JsonResponse
    {
        // Escalation guards + single guarded write path live in the service.
        if (! $this->assignments->assign($request->user(), $request->user_id, $request->role)) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['message' => 'Role updated']);
    }

    /**
     * Per-user permission grants (user_permissions), layered on the role
     * matrix by User::hasPermission.
     */
    public function userPermissions(string $userId): JsonResponse
    {
        abort_unless(\App\Models\User::query()->whereKey($userId)->exists(), 404);

        return response()->json(['data' => $this->permissions->userPermissions($userId)]);
    }

    public function grantUserPermission(GrantUserPermissionRequest $request, string $userId): JsonResponse
    {
        abort_unless(\App\Models\User::query()->whereKey($userId)->exists(), 404);

        $validated = $request->validated();

        $existed = $this->permissions->userPermissionExists($userId, $validated['permission']);

        $this->permissions->grantUserPermission(
            $userId,
            $validated['permission'],
            $request->user()?->id,
            $validated['note'] ?? null,
        );

        $this->auditChange('user_permission', "{$userId}:{$validated['permission']}", [
            'old_values' => ['granted' => $existed],
            'new_values' => ['granted' => true, 'permission' => $validated['permission'], 'note' => $validated['note'] ?? null],
        ], $request);

        return response()->json(['message' => "Granted {$validated['permission']} to user {$userId}"]);
    }

    public function revokeUserPermission(Request $request, string $userId, string $permission): JsonResponse
    {
        abort_unless(\App\Models\User::query()->whereKey($userId)->exists(), 404);

        if (! in_array($permission, \Database\Seeders\PermissionSeeder::CATALOG, true)) {
            return response()->json(['message' => 'Invalid permission'], 422);
        }

        $existed = $this->permissions->userPermissionExists($userId, $permission);

        $this->permissions->revokeUserPermission($userId, $permission);

        $this->auditChange('user_permission', "{$userId}:{$permission}", [
            'old_values' => ['granted' => $existed],
            'new_values' => ['granted' => false, 'permission' => $permission],
        ], $request);

        return response()->json(['message' => "Revoked {$permission} from user {$userId}"]);
    }

    /**
     * Permission scopes (W1.6): row-level narrowing attached to role or
     * user permission holders. Absence of a row = global.
     */
    public function scopes(): JsonResponse
    {
        return response()->json(['data' => $this->scopes->all()]);
    }

    public function grantScope(\Modules\Admin\Http\Requests\GrantScopeRequest $request): JsonResponse
    {
        $v = $request->validated();
        $this->scopes->grant($v);

        $scopeId = (string) ($v['id'] ?? trim(($v['role'] ?? '').':'.($v['permission'] ?? ''), ':'));
        $this->auditChange('permission_scope', $scopeId, [
            'new_values' => $v,
        ], $request);

        return response()->json(['message' => 'Scope granted'], 201);
    }

    public function revokeScope(string $id): JsonResponse
    {
        if (! $this->scopes->revoke($id)) {
            return response()->json(['message' => 'Scope not found'], 404);
        }

        $this->auditChange('permission_scope', $id, ['new_values' => ['revoked' => true]], request());

        return response()->json(['message' => 'Scope revoked']);
    }

    /**
     * Permission/role-definition changes are sensitive operations (spec §66).
     * Audit failures never block the mutation itself.
     *
     * @param  array{old_values?: array, new_values?: array}  $values
     */
    private function auditChange(string $entityType, string $entityId, array $values, Request $request): void
    {
        try {
            $this->audit->log([
                'action'       => 'update',
                'entity_type'  => $entityType,
                'entity_id'    => $entityId,
                'performed_by' => $request->user()?->id,
                'old_values'   => $values['old_values'] ?? null,
                'new_values'   => $values['new_values'] ?? null,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break RBAC mutations.
        }
    }
}
