<?php

namespace Core\Services\Contracts;

interface RoleRegistryInterface
{
    /** Canonical role values (AppRole enum, 40 roles). */
    public function canonical(): array;

    /** Slugs of admin-created roles. */
    public function custom(): array;

    /** Canonical ∪ custom, unique, canonical order first (retired excluded). */
    public function all(): array;

    /** Canonical ∪ custom including retired roles (console listing). */
    public function allIncludingRetired(): array;

    public function exists(string $role): bool;

    /** True for canonical (built-in) roles. */
    public function isCore(string $role): bool;

    /** Canonical roles a super admin took out of service. */
    public function retired(): array;

    /** True when the built-in role is currently retired (hidden). */
    public function isRetired(string $role): bool;

    /**
     * Takes a built-in role out of service: hides it from the console and
     * every picker and drops its grants/scopes. Returns false when the
     * role is not a canonical one.
     */
    public function retire(string $role, ?string $actorId, ?string $reason = null): bool;

    /** Brings a retired built-in role back into service. */
    public function restore(string $role): bool;

    /** Human label: AppRole::label() for canonical, stored name for custom. */
    public function label(string $role): string;

    /** Users currently holding the role in user_roles. */
    public function holderCount(string $role): int;

    /** Creates a custom role + its granted permission rows; returns the slug. */
    public function create(string $name, ?string $slug, ?string $description, array $permissions, ?string $actorId): string;

    /** Deletes a custom role and all of its permission/scope rows. */
    public function delete(string $slug): bool;
}
