<?php

namespace Core\Services;

use App\Models\User;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\PermissionServiceInterface;
use Core\Services\Contracts\RoleAssignmentInterface;
use Core\Services\Contracts\RoleRegistryInterface;
use Illuminate\Support\Facades\DB;

/**
 * Escalation-hardened role assignment. Every HTTP path that changes
 * user_roles must go through assign() — there is no unguarded writer.
 */
class RoleAssignmentService extends BaseService implements RoleAssignmentInterface
{
    public function __construct(
        private PermissionServiceInterface $permissions,
        private AuditServiceInterface $audit,
        private RoleRegistryInterface $roles,
    ) {
    }

    public function assign(User $actor, string $targetUserId, string $role): bool
    {
        // Guards first: never reveal target state to a rejected actor.
        $this->assertAssignable($actor, $targetUserId, $role);

        $exists = DB::table('users')
            ->where('id', $targetUserId)
            ->whereNull('deleted_at')
            ->exists();

        if (! $exists) {
            return false;
        }

        // Capture the previous roles before the delete+insert rewrite so the
        // audit row carries a before/after diff (spec §66).
        $previousRoles = DB::table('user_roles')
            ->where('user_id', $targetUserId)
            ->pluck('role')
            ->all();

        // Single write path: transactional delete+insert (no updateOrInsert
        // collapse of multi-role rows).
        $this->permissions->setUserRole($targetUserId, $role);

        try {
            $this->audit->log([
                'action'       => 'update',
                'entity_type'  => 'user',
                'entity_id'    => $targetUserId,
                'performed_by' => $actor->id,
                'old_values'   => ['roles' => $previousRoles],
                'new_values'   => ['roles' => [$role], 'details' => "Changed role to {$role}"],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break the assignment response.
        }

        return true;
    }

    public function reassignRoleHolders(string $from, string $to): void
    {
        $alreadyHoldsTarget = DB::table('user_roles')
            ->where('role', $to)
            ->select('user_id');

        DB::table('user_roles')
            ->where('role', $from)
            ->whereIn('user_id', $alreadyHoldsTarget)
            ->delete();

        DB::table('user_roles')
            ->where('role', $from)
            ->update(['role' => $to, 'updated_at' => now()]);
    }

    public function assertAssignable(User $actor, string $targetUserId, string $role): void
    {
        if (! $this->roles->exists($role)) {
            abort(422, 'Unknown role: '.$role);
        }

        if ($actor->id === $targetUserId) {
            abort(403, 'You cannot change your own role.');
        }

        $actorRoles = DB::table('user_roles')
            ->where('user_id', $actor->id)
            ->pluck('role')
            ->all();

        $targetRoles = DB::table('user_roles')
            ->where('user_id', $targetUserId)
            ->pluck('role')
            ->all();

        $isPrivilegedActor = array_intersect(['super_admin', 'administrator'], $actorRoles) !== [];

        $mayCreatePlainUser = $targetRoles === []
            && $role === 'user'
            && $actor->hasPermission('users.users.manage');

        if (! $isPrivilegedActor && ! $mayCreatePlainUser) {
            abort(403, 'Only administrators may assign roles.');
        }

        $actorIsSuperAdmin = in_array('super_admin', $actorRoles, true);

        if ($role === 'super_admin' && ! $actorIsSuperAdmin) {
            abort(403, 'Only a super admin can grant the super admin role.');
        }

        // Demoting a current super admin is allowed (no privilege is gained)
        // except when it would remove the last super admin from the system.
        if (in_array('super_admin', $targetRoles, true) && $role !== 'super_admin') {
            $superAdminCount = DB::table('user_roles')
                ->join('users', 'users.id', '=', 'user_roles.user_id')
                ->whereNull('users.deleted_at')
                ->where('user_roles.role', 'super_admin')
                ->distinct()
                ->count('user_roles.user_id');

            if ($superAdminCount <= 1) {
                abort(409, 'The last super admin cannot be demoted.');
            }
        }
    }
}
