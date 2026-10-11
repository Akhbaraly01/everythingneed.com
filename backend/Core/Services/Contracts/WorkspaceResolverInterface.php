<?php

namespace Core\Services\Contracts;

use App\Models\User;

/**
 * Single authority for workspace decisions: post-login landing,
 * available workspaces for the switcher, and the admin console hrefs
 * derived from server route middleware (never from the client registry).
 */
interface WorkspaceResolverInterface
{
    /**
     * Post-login / intended landing path for this user's highest-priority role.
     */
    public function landingPath(User $user): string;

    /**
     * Workspace keys available to this user, e.g. ['marketplace', 'admin'].
     * Keys map to targets in resources/js/components/workspace/WorkspaceSwitcher.
     *
     * @return list<string>
     */
    public function availableWorkspaces(User $user): array;

    /**
     * Concrete /admin route URIs (leading slash, no path params) this user
     * may reach, derived from the `role:` middleware registered on routes.
     * Drives sidebar visibility in ConsoleLayout.
     *
     * @return list<string>
     */
    public function adminHrefs(User $user): array;

    /**
     * Full payload for the shared Inertia `workspace` prop.
     *
     * @return array{current: string, available: list<string>, landing: string, adminHrefs: list<string>}
     */
    public function workspaceFor(User $user, string $currentPath): array;
}
