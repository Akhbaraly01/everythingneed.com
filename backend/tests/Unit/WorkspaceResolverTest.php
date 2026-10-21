<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\UserRole;
use Core\Services\WorkspaceResolver;
use Database\Seeders\PermissionSeeder;
use Tests\TestCase;

class WorkspaceResolverTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    private function userWithRoles(string ...$roles): User
    {
        $user = User::factory()->create();

        foreach ($roles as $role) {
            UserRole::create(['user_id' => $user->id, 'role' => $role]);
        }

        return $user;
    }

    public function test_landing_path_matches_canonical_table(): void
    {
        $expected = [
            'super_admin' => '/admin/dashboard',
            'administrator' => '/admin/dashboard',
            'finance_admin' => '/admin/finance',
            'healthcare_admin' => '/admin/healthcare/doctors',
            'learning_admin' => '/admin/learning/courses',
        'learning_reviewer' => '/admin/learning/review',
            'support_agent' => '/admin/support/tickets',
            'customer_service' => '/admin/support/tickets',
            'content_manager' => '/admin/cms',
            'marketplace_admin' => '/admin/categories',
            'moderator' => '/admin/approvals',
            'platform_ops' => '/admin/dashboard',
            'security_admin' => '/admin/dashboard',
            'analytics_admin' => '/admin/dashboard',
            'orders_admin' => '/admin/orders',
            'wallet_admin' => '/admin/wallet',
            'support_admin' => '/admin/support/tickets',
            'real_estate_admin' => '/admin/real-estate',
            'needs_admin' => '/admin/dashboard',
            'payout_reviewer' => '/admin/payouts',
            'refund_agent' => '/admin/orders',
            'inventory_manager' => '/admin/inventory',
            'cms_editor' => '/admin/cms',
            'auditor' => '/admin/audit-logs',
            'analyst' => '/admin/dashboard',
            'hotel_admin' => '/admin/hotels',
            'food_admin' => '/admin/food',
            'transport_admin' => '/admin/transport',
            'jobs_admin' => '/admin/jobs',
            'pharmacy_admin' => '/admin/dashboard',
            'agriculture_admin' => '/admin/dashboard',
            'building_admin' => '/admin/dashboard',
            'kyc_reviewer' => '/admin/dashboard',
            'vendor_admin' => '/vendor',
            'worker' => '/provider',
            'user' => '/dashboard',
        ];

        $resolver = new WorkspaceResolver();

        foreach ($expected as $role => $landing) {
            $user = $this->userWithRoles($role);
            $this->assertSame($landing, $resolver->landingPath($user), "landing for {$role}");
        }
    }

    public function test_users_without_roles_fall_back_to_marketplace(): void
    {
        $user = User::factory()->create();
        $resolver = new WorkspaceResolver();

        $this->assertSame('/dashboard', $resolver->landingPath($user));
        $this->assertSame(['marketplace'], $resolver->availableWorkspaces($user));
    }

    public function test_multi_role_users_follow_priority_order(): void
    {
        $resolver = new WorkspaceResolver();

        // administrator outranks worker in the priority table.
        $adminWorker = $this->userWithRoles('worker', 'administrator');
        $this->assertSame('/admin/dashboard', $resolver->landingPath($adminWorker));
        $this->assertSame(['marketplace', 'admin', 'provider'], $resolver->availableWorkspaces($adminWorker));

        // vendor_admin outranks worker and also holds scoped admin-read
        // permissions (orders/inventory), so the admin workspace is available.
        $vendorWorker = $this->userWithRoles('worker', 'vendor_admin');
        $this->assertSame('/vendor', $resolver->landingPath($vendorWorker));
        $this->assertSame(['marketplace', 'admin', 'vendor', 'provider'], $resolver->availableWorkspaces($vendorWorker));
    }

    public function test_admin_hrefs_are_scoped_per_role(): void
    {
        $resolver = new WorkspaceResolver();

        $superAdmin = $this->userWithRoles('super_admin');
        $superHrefs = $resolver->adminHrefs($superAdmin);
        $this->assertContains('/admin/users', $superHrefs);
        $this->assertContains('/admin/rbac', $superHrefs);
        $this->assertContains('/admin/dashboard', $superHrefs);

        $categoryAdmin = $this->userWithRoles('marketplace_admin');
        $categoryHrefs = $resolver->adminHrefs($categoryAdmin);
        $this->assertContains('/admin/approvals', $categoryHrefs);
        $this->assertContains('/admin/categories', $categoryHrefs);
        $this->assertNotContains('/admin/users', $categoryHrefs);
        $this->assertNotContains('/admin/rbac', $categoryHrefs);

        $support = $this->userWithRoles('support_agent');
        $supportHrefs = $resolver->adminHrefs($support);
        $this->assertContains('/admin/support/tickets', $supportHrefs);
        $this->assertContains('/admin/departments', $supportHrefs);
        $this->assertNotContains('/admin/rbac', $supportHrefs);
    }

    public function test_workspace_for_maps_current_path_and_downgrades_unreachable_workspaces(): void
    {
        $resolver = new WorkspaceResolver();

        $superAdmin = $this->userWithRoles('super_admin');

        $atAdminPage = $resolver->workspaceFor($superAdmin, '/admin/users');
        $this->assertSame('admin', $atAdminPage['current']);
        $this->assertContains('admin', $atAdminPage['available']);
        $this->assertNotEmpty($atAdminPage['adminHrefs']);

        $atMarketplace = $resolver->workspaceFor($superAdmin, '/dashboard');
        $this->assertSame('marketplace', $atMarketplace['current']);

        // A vendor_admin holder of scoped admin-read permissions enters the
        // admin workspace, but only sees the hrefs its permissions open
        // (never users/RBAC).
        $vendor = $this->userWithRoles('vendor_admin');
        $vendorAtAdmin = $resolver->workspaceFor($vendor, '/admin/users');
        $this->assertSame('admin', $vendorAtAdmin['current']);
        $this->assertContains('/admin/orders', $vendorAtAdmin['adminHrefs']);
        $this->assertContains('/admin/dashboard', $vendorAtAdmin['adminHrefs']);
        $this->assertNotContains('/admin/users', $vendorAtAdmin['adminHrefs']);
        $this->assertNotContains('/admin/rbac', $vendorAtAdmin['adminHrefs']);

        // Non-admin roles expose no admin hrefs at all.
        $plain = $this->userWithRoles('user');
        $this->assertSame([], $resolver->workspaceFor($plain, '/dashboard')['adminHrefs']);
    }

    public function test_permission_grants_open_matching_admin_pages(): void
    {
        $resolver = new WorkspaceResolver();

        // A plain user granted learn.overview.view can open the learning
        // console page even though no role list names them.
        $powered = $this->userWithRoles('user');
        \Illuminate\Support\Facades\DB::table('user_permissions')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $powered->id,
            'permission' => 'learn.overview.view',
            'state' => 'granted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertContains('admin', $resolver->availableWorkspaces($powered));
        $this->assertContains('/admin/learning/courses', $resolver->adminHrefs($powered));
        $this->assertContains('/admin/dashboard', $resolver->adminHrefs($powered));
        $this->assertNotContains('/admin/users', $resolver->adminHrefs($powered));

        // A permission with no permission-gated /admin page opens nothing.
        $unrelated = $this->userWithRoles('user');
        \Illuminate\Support\Facades\DB::table('user_permissions')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $unrelated->id,
            'permission' => 'products.products.view',
            'state' => 'granted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertSame(['marketplace'], $resolver->availableWorkspaces($unrelated));
        $this->assertSame([], $resolver->adminHrefs($unrelated));
    }
}
