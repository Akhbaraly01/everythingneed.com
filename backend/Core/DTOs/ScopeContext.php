<?php

namespace Core\DTOs;

use App\Models\User;
use Core\Enums\PermissionScope;

/**
 * Resolved row-scope context for one (user, permission) pair.
 *
 * Built server-side by ScopeResolver — never taken from the browser.
 * Fail-closed semantics: a narrowing scope without its binding (vendor
 * without a vendor row, domain without a value) resolves to a context the
 * ScopeFilter turns into an empty result set.
 */
final class ScopeContext
{
    public function __construct(
        public readonly PermissionScope $scope,
        public readonly string $userId,
        public readonly ?string $value = null,
        public readonly ?string $vendorId = null,
    ) {}

    public static function global(User $user): self
    {
        return new self(PermissionScope::GLOBAL, $user->id);
    }

    public function isDeferred(): bool
    {
        return $this->scope->isDeferred();
    }

    public function isNarrowing(): bool
    {
        return $this->scope !== PermissionScope::GLOBAL && ! $this->isDeferred();
    }
}
