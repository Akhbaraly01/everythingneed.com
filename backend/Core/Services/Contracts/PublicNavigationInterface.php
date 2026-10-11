<?php

namespace Core\Services\Contracts;

use App\Models\User;

/**
 * Public site navigation (spec S46: "No hard-coded navigation").
 *
 * Resolves the five menu locations (header, footer, mobile, category, more)
 * from the `navigations`/`navigation_items` tables for the current viewer.
 * Raw published rows are cached (see flush()); guest/auth/role visibility is
 * filtered per request against the caller's identity.
 *
 * Implemented by Core\Services\PublicNavigationResolver.
 */
interface PublicNavigationInterface
{
    /**
     * Menus for one viewer keyed by location. Each location is a list of
     * item DTOs: {id, title, url, icon, target, devices, children[]} -
     * `children` nests recursively; `devices` is null (all) or a subset of
     * [desktop, mobile] for the client to filter.
     *
     * @return array{header: list<array<string, mixed>>, footer: list<array<string, mixed>>, mobile: list<array<string, mixed>>, category: list<array<string, mixed>>, more: list<array<string, mixed>>}
     */
    public function menus(?User $user): array;

    /**
     * Drop the raw-row cache. Called by the navigation builder on every
     * write so admin edits show up on the next page load.
     */
    public function flush(): void;
}
