<?php

namespace Core\Services\Contracts;

interface RoleRegistryInterface
{
    /** Canonical role values (AppRole enum, 40 roles). */
    public function canonical(): array;

    /** Slugs of admin-created roles. */
    public function custom(): array;

    /** Canonical ∪ custom, unique, canonical order first. */
    public function all(): array;

    public function exists(string $role): bool;

    /** True for canonical (built-in) roles. */
    public function isCore(string $role): bool;

    /** Human label: AppRole::label() for canonical, stored name for custom. */
    public function label(string $role): string;

    /** Users currently holding the role in user_roles. */
    public function holderCount(string $role): int;

    /** Creates a custom role + its granted permission rows; returns the slug. */
    public function create(string $name, ?string $slug, ?string $description, array $permissions, ?string $actorId): string;

    /** Deletes a custom role and all of its permission/scope rows. */
    public function delete(string $slug): bool;
}
