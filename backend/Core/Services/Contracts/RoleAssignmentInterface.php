<?php

namespace Core\Services\Contracts;

use App\Models\User;

/**
 * The single guarded path for granting/replacing a user's role set.
 * Enforces escalation guards (no self-assign, only super_admin can grant
 * super_admin, the last super admin cannot be demoted) before delegating
 * the write to PermissionService::setUserRole.
 */
interface RoleAssignmentInterface
{
    /**
     * Guarded role replacement: validates, writes, audits.
     * Returns false when the target user does not exist; aborts with
     * 403/409/422 when an escalation guard rejects the assignment.
     */
    public function assign(User $actor, string $targetUserId, string $role): bool;

    /**
     * Escalation guards only — throws HttpException when the assignment
     * is not permitted for this actor/target/role combination.
     */
    public function assertAssignable(User $actor, string $targetUserId, string $role): void;
}
