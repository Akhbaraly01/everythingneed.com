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

    public function landingPath(User $user): string
    {
        $roles = $user->roles->pluck('role')->all();

        foreach ((array) config('workspace.landing_priority', []) as $role) {
            if (in_array($role, $roles, true)) {
                return (string) config("workspace.landings.{$role}", config('workspace.default_landing', '/dashboard'));
            }
        }

        return (string) config('workspace.default_landing', '/dashboard');
    }

    public function availableWorkspaces(User $user): array
    {
        $roles = $user->roles->pluck('role')->all();
        $available = ['marketplace'];

        if (array_intersect((array) config('workspace.admin_console_roles', []), $roles)) {
            $available[] = 'admin';
        }
        if (array_intersect((array) config('workspace.vendor_console_roles', []), $roles)) {
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

        return array_keys($hrefs);
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
}
