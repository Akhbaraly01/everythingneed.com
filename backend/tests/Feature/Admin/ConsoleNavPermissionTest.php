<?php

namespace Tests\Feature\Admin;

use Database\Seeders\PermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W1.7 — consoleNavigation permission field contract:
 *  1. every admin entry declares a canonical permission (Dashboard is the
 *     single documented exemption — no catalog permission spans all 33
 *     console roles);
 *  2. the permission exists in the canonical catalog;
 *  3. every role on the route's role: middleware holds the permission in
 *     the seeded matrix — so the UX filter never hides a page its role can
 *     legitimately open (server middleware stays the authority regardless).
 */
class ConsoleNavPermissionTest extends TestCase
{
    /** @return array<string, string|null> href => permission */
    private function adminEntries(): array
    {
        $ts = (string) file_get_contents(resource_path('js/config/consoleNavigation.ts'));

        preg_match_all("#href:\s*'(/admin[^']*)'([^\n]*)#", $ts, $matches, PREG_SET_ORDER);

        $entries = [];
        foreach ($matches as [, $href, $rest]) {
            $entries[$href] = preg_match("#permission:\s*'([^']+)'#", $rest, $p) ? $p[1] : null;
        }

        return $entries;
    }

    #[Test]
    public function test_every_admin_entry_declares_a_permission_except_documented_exemptions(): void
    {
        $exempt = ['/admin/dashboard'];
        $entries = $this->adminEntries();

        $this->assertNotEmpty($entries);

        foreach ($entries as $href => $permission) {
            if (in_array($href, $exempt, true)) {
                $this->assertNull($permission, "{$href} is the documented permissionless entry");
                continue;
            }

            $this->assertNotNull($permission, "{$href} must declare a permission");
        }
    }

    #[Test]
    public function test_declared_permissions_exist_in_the_canonical_catalog(): void
    {
        foreach ($this->adminEntries() as $href => $permission) {
            if ($permission === null) {
                continue;
            }

            $this->assertContains(
                $permission,
                PermissionSeeder::CATALOG,
                "{$href} declares unknown permission {$permission}",
            );
        }
    }

    #[Test]
    public function test_every_route_role_holds_the_declared_permission(): void
    {
        $this->seed(PermissionSeeder::class);

        foreach ($this->adminEntries() as $href => $permission) {
            if ($permission === null) {
                continue;
            }

            $route = Route::getRoutes()->match(Request::create($href, 'GET'));

            $roles = collect($route->gatherMiddleware())
                ->filter(fn ($m) => is_string($m) && str_starts_with($m, 'role:'))
                ->flatMap(fn ($m) => explode(',', substr($m, 5)))
                ->values();

            $this->assertNotEmpty($roles, "{$href} must be role-gated");

            foreach ($roles as $role) {
                $held = \Illuminate\Support\Facades\DB::table('role_permissions')
                    ->where('role', $role)
                    ->where('permission', $permission)
                    ->exists();

                $this->assertTrue(
                    $held,
                    "role {$role} reaches {$href} but lacks {$permission} — the nav permission field would hide a reachable page",
                );
            }
        }
    }
}
