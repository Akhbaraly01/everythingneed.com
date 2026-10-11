<?php

namespace Tests\Feature\Database;

use Database\Seeders\FeatureFlagSeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedersTest extends TestCase
{
    use RefreshDatabase;

    public function test_permission_seeder_is_idempotent_and_builds_matrix(): void
    {
        $this->seed(PermissionSeeder::class);
        $first = \Illuminate\Support\Facades\DB::table('role_permissions')->count();

        $this->seed(PermissionSeeder::class);
        $this->assertSame($first, \Illuminate\Support\Facades\DB::table('role_permissions')->count());
        $this->assertGreaterThan(0, $first);

        $this->assertDatabaseHas('role_permissions', ['role' => 'super_admin', 'permission' => 'products.products.create']);
        $this->assertDatabaseHas('role_permissions', ['role' => 'vendor_admin', 'permission' => 'inventory.stock.manage']);
        $this->assertDatabaseHas('role_permissions', ['role' => 'finance_admin', 'permission' => 'analytics.overview.view']);
    }

    public function test_feature_flag_seeder_is_idempotent(): void
    {
        $this->seed(FeatureFlagSeeder::class);
        $first = \Illuminate\Support\Facades\DB::table('feature_flags')->count();
        $this->assertSame(8, $first);

        $this->seed(FeatureFlagSeeder::class);
        $this->assertSame($first, \Illuminate\Support\Facades\DB::table('feature_flags')->count());

        $this->assertDatabaseHas('feature_flags', ['key' => 'pharmacy_module', 'is_enabled' => true]);
        $this->assertDatabaseHas('feature_flags', ['key' => 'rides_module', 'is_enabled' => false]);
    }

    public function test_local_access_seeder_refuses_non_local_env(): void
    {
        $source = file_get_contents(base_path('database/seeders/DatabaseSeeder.php'));
        $this->assertStringContainsString("app()->environment(['local', 'testing'])", $source);

        // LocalAccessSeeder + TestUsersSeeder still exist for known local logins.
        $this->assertFileExists(base_path('database/seeders/LocalAccessSeeder.php'));
        $this->assertFileExists(base_path('database/seeders/TestUsersSeeder.php'));
    }

    public function test_permission_catalog_covers_critical_module_permissions(): void
    {
        $catalog = PermissionSeeder::CATALOG;

        foreach ([
            'categories.categories.manage',
            'inventory.stock.view',
            'inventory.stock.manage',
            'analytics.overview.view',
            'settings.system.update',
            'products.products.create',
            'orders.orders.manage',
            'finance.overview.view',
            'cms.pages.manage',
            'users.permissions.manage',
        ] as $perm) {
            $this->assertContains($perm, $catalog, "Missing critical permission: {$perm}");
        }
    }
}
