<?php

namespace Core\Services\Contracts;

interface PermissionServiceInterface
{
    public function assignRole(string $userId, string $role, ?string $categoryId = null): object;
    public function removeRole(string $userId, string $role): bool;
    public function hasRole(string $userId, string $role): bool;
    public function grantPermission(string $roleId, string $permission): object;
    public function revokePermission(string $roleId, string $permission): bool;
}
