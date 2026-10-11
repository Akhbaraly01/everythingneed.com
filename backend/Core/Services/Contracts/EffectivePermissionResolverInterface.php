<?php

namespace Core\Services\Contracts;

use App\Models\User;

interface EffectivePermissionResolverInterface
{
    /**
     * Single effective permission check (W2): super_admin bypass,
     * 2-segment Spec S64 aliases, role matrix UNION per-user grants,
     * granted state only (denied rows never satisfy).
     */
    public function has(User $user, string $permission): bool;

    /**
     * Every effective permission string for the user, role matrix UNION
     * per-user grants (granted state only). super_admin resolves to ['*'].
     *
     * @return list<string>
     */
    public function all(User $user): array;
}
