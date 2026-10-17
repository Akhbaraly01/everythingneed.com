<?php

namespace Core\Services\Contracts;

/**
 * Administrative user lifecycle (identity domain).
 * Backs the admin user management endpoints; all queries on
 * users / user_roles / profiles live here, not in controllers.
 */
interface UserAdminInterface
{
    /**
     * @param  array{search?: string, role?: string, per_page?: int, page?: int}  $filters
     * @return array{data: array, meta: array{total: int, page: int, per_page: int}}
     */
    public function paginate(array $filters = []): array;

    public function find(string $id): ?object;

    /**
     * Role changes are NOT exposed here: every grant goes through
     * RoleAssignmentInterface::assign (the single guarded write path).
     */

    /** Suspend + revoke every API session. Returns false when the user is missing. */
    public function suspend(string $id): bool;

    public function restore(string $id): bool;

    /**
     * Profile update (name / email). Returns false when the user is missing.
     * Role changes are NOT done here: grants go through
     * RoleAssignmentInterface::assign (the single guarded write path).
     *
     * @param  array{name?: string, email?: string, email_verified_at?: mixed}  $data
     */
    public function update(string $id, array $data): bool;

    public function softDelete(string $id): bool;

    /** Email uniqueness for admin-provisioned accounts (soft-delete aware). */
    public function emailExists(string $email): bool;

    /**
     * Insert an admin-provisioned account (uuid id, hashed password,
     * immediately verified). Returns the new user id. The role is NOT set
     * here: grants go through RoleAssignmentInterface::assign afterwards.
     *
     * @param  array{name: string, email: string, password: string, id?: string}  $data
     */
    public function create(array $data): string;

    /** True when the target holds super_admin and NO other active super admin remains (lockout guard). */
    public function isLastActiveSuperAdmin(string $targetId): bool;
}
