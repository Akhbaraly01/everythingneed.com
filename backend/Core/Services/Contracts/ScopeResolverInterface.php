<?php

namespace Core\Services\Contracts;

use App\Models\User;
use Core\DTOs\ScopeContext;

interface ScopeResolverInterface
{
    /**
     * Server-side row-scope for a (user, permission) pair:
     * super_admin -> global; user-level scope row beats role rows; among
     * role rows the narrowest wins; no row -> global.
     */
    public function contextFor(User $user, string $permission): ScopeContext;

    /** Upsert a scope row (role or user holder). */
    public function grant(array $attributes): void;

    /** Delete a scope row by id. */
    public function revoke(string $id): bool;

    /** @return list<object> all scope rows (id, holder_type, holder_id, permission, scope, scope_value). */
    public function all(): array;
}
