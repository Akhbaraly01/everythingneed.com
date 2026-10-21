<?php

namespace Core\Services;

use App\Models\User;
use Core\Services\Contracts\WorkspaceResolverInterface;
use Illuminate\Support\Facades\Route;

class WorkspaceResolver implements WorkspaceResolverInterface
{
    /**
     * Static cache of role => [admin hrefs] built from the router once
     * per process (route definitions are immutable at runtime).
     *
     * @var array<string, list<string>>|null
     */
    private static ?array $roleHrefs = null;

    /**
     * Static cache of permission-expression => [admin hrefs] for routes
     * guarded by the permission: middleware (custom-role parity).
     *
     * @var array<string, list<string>>|null
     */
    private static ?array $permissionHrefs = null;

    public function landingPath(User $user): string
    {
        $roles = $user->roles->pluck('role')->all();

        foreach ((array) config('workspace.landing_priority', []) as $role) {
            if (in_array($role, $roles, true)) {
                return (string) config("workspace.landings.{$role}", config('workspace.default_landing', '/dashboard'));
            }
        }

        // A registered vendor (an account that owns a `vendors` row) belongs
        // to the vendor console even without a console role.
        if ($this->ownsVendor($user)) {
            return (string) config('workspace.vendor_landing', '/vendor');
        }

        return (string) config('workspace.default_landing', '/dashboard');
    }

    public function availableWorkspaces(User $user): array
    {
        $roles = $user->roles->pluck('role')->all();
        $available = ['marketplace'];

        // Admin console: role-based (config lists) or permission-based
        // (the user holds the permissions of at least one /admin page).
        if (
            array_intersect((array) config('workspace.admin_console_roles', []), $roles) ||
            $this->hasPermissionBasedAdminAccess($user)
        ) {
            $available[] = 'admin';
        }
        // Vendor console: the vendor_admin role, or ownership of a vendors
        // row (self-scoped - a registered vendor holds no console role).
        if (
            array_intersect((array) config('workspace.vendor_console_roles', []), $roles) ||
            $this->ownsVendor($user)
        ) {
            $available[] = 'vendor';
        }
        if (array_intersect((array) config('workspace.provider_console_roles', []), $roles)) {
            $available[] = 'provider';
        }

        return $available;
    }

    public function adminHrefs(User $user): array
    {
        $roles = $user->roles->pluck('role')->all();
        $hrefs = [];

        foreach (self::roleHrefs() as $role => $uris) {
            if (in_array($role, $roles, true)) {
                foreach ($uris as $uri) {
                    $hrefs[$uri] = true;
                }
            }
        }

        // Custom roles carry no role-gated hrefs; include pages their
        // granted permissions can actually open.
        $permissionAccess = false;
        foreach (self::permissionHrefs() as $expression => $uris) {
            if ($this->satisfiesPermissionExpression($user, $expression)) {
                $permissionAccess = true;
                foreach ($uris as $uri) {
                    $hrefs[$uri] = true;
                }
            }
        }

        // The dashboard/root gate is role- OR permission-based (admin.access),
        // so every permission-backed console user must see the landing entry.
        if ($permissionAccess) {
            $hrefs['/admin/dashboard'] = true;
        }

        return array_keys($hrefs);
    }

    private function hasPermissionBasedAdminAccess(User $user): bool
    {
        foreach (self::permissionHrefs() as $expression => $uris) {
            if ($this->satisfiesPermissionExpression($user, $expression)) {
                return true;
            }
        }

        return false;
    }

    /**
     * True when the account owns a vendor record (self-scoped ownership,
     * not a role). A registered vendor holds no console role, so this is
     * what puts them in the vendor console.
     */
    private function ownsVendor(User $user): bool
    {
        if (! config('workspace.vendor_console_owners', true)) {
            return false;
        }

        try {
            return $user->vendor()->exists();
        } catch (\Throwable) {
            // A missing vendors table must never break the workspace shell.
            return false;
        }
    }

    /**
     * Mirrors EnsureUserHasPermission: comma-separated requirements are
     * OR; '&'-joined tokens within one requirement must ALL pass.
     */
    private function satisfiesPermissionExpression(User $user, string $expression): bool
    {
        foreach (explode(',', $expression) as $requirement) {
            if ($this->satisfiesRequirement($user, $requirement)) {
                return true;
            }
        }

        return false;
    }

    private function satisfiesRequirement(User $user, string $requirement): bool
    {
        foreach (explode('&', $requirement) as $token) {
            if (! $this->satisfiesToken($user, $token)) {
                return false;
            }
        }

        return true;
    }

    private function satisfiesToken(User $user, string $token): bool
    {
        if ($token === '') {
            return false;
        }

        if (str_ends_with($token, '.*')) {
            $prefix = substr($token, 0, -1); // keep the trailing dot

            foreach (\Database\Seeders\PermissionSeeder::CATALOG as $candidate) {
                if (str_starts_with($candidate, $prefix) && $user->hasPermission($candidate)) {
                    return true;
                }
            }

            return false;
        }

        return $user->hasPermission($token);
    }

    public function workspaceFor(User $user, string $currentPath): array
    {
        $path = '/' . ltrim($currentPath, '/');
        $current = 'marketplace';

        if ($path === '/admin' || str_starts_with($path, '/admin/')) {
            $current = 'admin';
        } elseif ($path === '/vendor' || str_starts_with($path, '/vendor/')) {
            $current = 'vendor';
        } elseif ($path === '/provider' || str_starts_with($path, '/provider/')) {
            $current = 'provider';
        }

        $available = $this->availableWorkspaces($user);
        if (! in_array($current, $available, true)) {
            // Never claim a workspace the role cannot enter.
            $current = 'marketplace';
        }

        return [
            'current' => $current,
            'available' => $available,
            'landing' => $this->landingPath($user),
            'adminHrefs' => in_array('admin', $available, true) ? $this->adminHrefs($user) : [],
        ];
    }

    /**
     * Build (and cache) the role => concrete /admin URIs map from the router.
     * Only routes whose `role:` middleware names the role are included;
     * parameterized URIs are excluded because the sidebar matches exact hrefs.
     *
     * @return array<string, list<string>>
     */
    private static function roleHrefs(): array
    {
        if (self::$roleHrefs !== null) {
            return self::$roleHrefs;
        }

        $map = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (! (str_starts_with($uri, 'admin') || str_starts_with($uri, '/admin'))) {
                continue;
            }
            if (str_contains($uri, '{')) {
                continue;
            }

            foreach ($route->gatherMiddleware() as $middleware) {
                if (! is_string($middleware) || ! str_starts_with($middleware, 'role:')) {
                    continue;
                }

                $href = '/' . ltrim($uri, '/');
                foreach (explode(',', substr($middleware, 5)) as $role) {
                    $role = trim($role);
                    if ($role === '') {
                        continue;
                    }
                    $map[$role][$href] = true;
                }
            }
        }

        self::$roleHrefs = array_map(
            static fn (array $hrefs): array => array_keys($hrefs),
            $map
        );

        return self::$roleHrefs;
    }

    /**
     * Build (and cache) the permission-expression => concrete /admin URIs
     * map from routes guarded by `permission:` middleware. Expressions are
     * kept verbatim (comma OR groups) so each user is evaluated with the
     * same semantics the middleware applies.
     *
     * @return array<string, list<string>>
     */
    private static function permissionHrefs(): array
    {
        if (self::$permissionHrefs !== null) {
            return self::$permissionHrefs;
        }

        $map = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (! (str_starts_with($uri, 'admin') || str_starts_with($uri, '/admin'))) {
                continue;
            }
            if (str_contains($uri, '{')) {
                continue;
            }

            foreach ($route->gatherMiddleware() as $middleware) {
                if (! is_string($middleware) || ! str_starts_with($middleware, 'permission:')) {
                    continue;
                }

                $expression = trim(substr($middleware, 11));
                if ($expression === '') {
                    continue;
                }

                $map[$expression]['/' . ltrim($uri, '/')] = true;
            }
        }

        self::$permissionHrefs = array_map(
            static fn (array $hrefs): array => array_keys($hrefs),
            $map
        );

        return self::$permissionHrefs;
    }
}
