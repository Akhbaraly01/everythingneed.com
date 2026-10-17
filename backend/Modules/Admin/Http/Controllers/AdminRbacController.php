<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\PermissionServiceInterface;
use Core\Services\Contracts\RoleAssignmentInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Admin\Http\Requests\AssignUserRoleRequest;
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
        // Spec A?65 named admin roles.
        'category_admin', 'vendor_manager', 'content_admin',
    ];

    public function __construct(
        private PermissionServiceInterface $permissions,
        private RoleAssignmentInterface $assignments,
        private \Core\Services\Contracts\ScopeResolverInterface $scopes,
        private \Core\Services\Contracts\AuditServiceInterface $audit,
    ) {}

    public function roles(): JsonResponse
    {
        return response()->json(['data' => $this->permissions->roleSummaries(self::ROLES)]);
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
     */
    public function matrix(): JsonResponse
    {
        return response()->json([
            'data' => $this->permissions->permissionMatrix(self::ROLES),
            'denied' => $this->permissions->deniedMatrix(self::ROLES),
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
