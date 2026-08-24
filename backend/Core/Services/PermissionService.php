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
}
