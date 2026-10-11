<?php

namespace Core\Services\Contracts;

interface PermissionServiceInterface
{
    public function assignRole(string $userId, string $role, ?string $categoryId = null): object;
    public function removeRole(string $userId, string $role): bool;
    public function hasRole(string $userId, string $role): bool;

    /** True when the user holds at least one of the given roles. */
    public function hasAnyRole(string $userId, array $roles): bool;
    public function grantPermission(string $roleId, string $permission): object;
    public function revokePermission(string $roleId, string $permission): bool;

    /** Primary (single) role row for a user from user_roles, or null. */
    public function primaryRole(string $userId): ?string;

    /** User counts per role, keyed for every canonical role (zero-filled). */
    public function roleSummaries(array $canonicalRoles): array;

    /** role => [permission...] from the role_permissions table (granted state only). */
    public function permissionMatrix(array $canonicalRoles): array;

    /** role => [permission...] revoked to the denied state (restorable, W2). */
    public function deniedMatrix(array $canonicalRoles): array;

    /** Upsert a single granular permission for a role (role_permissions table). */
    public function grantRolePermission(string $role, string $permission): void;

    /** True when the role holds the granular permission in granted state. */
    public function rolePermissionExists(string $role, string $permission): bool;

    /** Flip a role permission to denied (row kept for audit/restore). */
    public function revokeRolePermission(string $role, string $permission): void;

    /** Add a per-user permission grant (user_permissions table; idempotent). */
    public function grantUserPermission(string $userId, string $permission, ?string $grantedBy = null, ?string $note = null): void;

    /** Flip a per-user permission to denied (row kept for audit/restore). */
    public function revokeUserPermission(string $userId, string $permission): void;

    /** True when the user holds the explicit grant in granted state. */
    public function userPermissionExists(string $userId, string $permission): bool;

    /** @return list<string> Explicit per-user grants in granted state. */
    public function userPermissions(string $userId): array;

    /** Set the user's single primary role (replace any existing row). */
    public function setUserRole(string $userId, string $role): void;

    /**
     * Server-derived product category scope for a viewer (never taken from
     * the browser): user_roles.category_id -> categories.name -> products.category.
     *
     * null          = unrestricted (super_admin/administrator and non-category viewers)
     * string        = exact products.category value the viewer may moderate
     * '__no_category_assigned__' = fail-closed sentinel for an unassigned marketplace_admin
     */
    public function productCategoryScope(string $userId): ?string;
    public function managedCategoryId(string $userId): ?string;
    public function withinManagedScope(string $categoryId, ?string $scopeRootId): bool;
}
