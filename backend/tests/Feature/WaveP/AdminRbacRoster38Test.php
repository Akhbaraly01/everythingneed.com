<?php

namespace Tests\Feature\WaveP;

use Core\Enums\AppRole;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * Wave P — spec 65: canonical 38-role roster wired end to end
 * (enum → config landings/priority → seeded matrix → console navigation).
 */
class AdminRbacRoster38Test extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    public function test_canonical_role_count_is_39(): void
    {
        $this->assertSame(39, count(AppRole::cases()));
    }

    public function test_workspace_landings_cover_every_role(): void
    {
        $landings = config('workspace.landings');

        foreach (AppRole::cases() as $role) {
            $this->assertArrayHasKey($role->value, $landings, "Missing landing for {$role->value}.");
            $this->assertNotEmpty($landings[$role->value]);
        }
    }

    public function test_admin_console_roles_are_valid_and_prioritised(): void
    {
        $consoleRoles = config('workspace.admin_console_roles');
        $landings = config('workspace.landings');
        $priority = config('workspace.landing_priority');
        $valid = array_map(fn (AppRole $role) => $role->value, AppRole::cases());

        foreach ($consoleRoles as $role) {
            $this->assertContains($role, $valid, "admin_console_roles holds unknown role {$role}.");
            $this->assertArrayHasKey($role, $landings, "No landing for console role {$role}.");
            $this->assertContains($role, $priority, "Console role {$role} missing from landing_priority.");
        }

        // The three spec-65 roles must be console roles.
        foreach (['category_admin', 'vendor_manager', 'content_admin'] as $role) {
            $this->assertContains($role, $consoleRoles);
        }
    }

    public function test_new_console_landings_exist_in_console_navigation(): void
    {
        $nav = File::get(base_path('resources/js/config/consoleNavigation.ts'));

        foreach (['/admin/categories', '/admin/vendors', '/admin/cms'] as $href) {
            $this->assertStringContainsString($href, $nav, "consoleNavigation.ts missing {$href}.");
        }
    }

    public function test_seeded_matrix_grants_the_three_new_roles(): void
    {
        $grants = function (string $role): array {
            return DB::table('role_permissions')->where('role', $role)->pluck('permission')->all();
        };

        $category = $grants('category_admin');
        $this->assertContains('categories.categories.manage', $category);
        $this->assertContains('products.products.view', $category);

        $vendor = $grants('vendor_manager');
        $this->assertContains('vendors.vendors.approve', $vendor);
        $this->assertContains('products.products.view', $vendor);

        $content = $grants('content_admin');
        $this->assertContains('cms.pages.view', $content);
        $this->assertContains('navigation.manage', $content);
        $this->assertNotEmpty($content);
    }
}
