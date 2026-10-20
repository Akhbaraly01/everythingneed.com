<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Modules\Admin\Http\Controllers\AdminRbacController;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W1.8 (§75) — per-role allow/deny authorization suite.
 *
 * Every role in AdminRbacController::ROLES (40 since TODO 21) is exercised against a
 * probe catalog of admin API endpoints whose exact gates are read from
 * Modules/Admin/Routes/api.php + AdminPolicy. For each role:
 *   - allow probes must NOT return 401/403 (page/API parity),
 *   - deny probes must return exactly 403 (least-privilege pin).
 *
 * Complements AdminConsoleApiParityTest (allow-side) by pinning the
 * deny-side for every roster role, including non-console roles.
 */
class AdminRoleAuthorizationSuiteTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    /** All console roles: every roster entry except provider/customer. */
    private static function consoleRoles(): array
    {
        return array_values(array_diff(
            AdminRbacController::ROLES,
            ['worker', 'user', 'vendor_admin'],
        ));
    }

    /**
     * Probe catalog: endpoint => roles allowed by its gate.
     *
     * @return array<string, list<string>>
     */
    private static function probes(): array
    {
        $console = self::consoleRoles();

        return [
            // viewDashboard — all console roles (AdminPolicy::viewDashboard).
            '/api/admin/stats' => $console,
            // manageUsers (super, administrator, security_admin).
            '/api/admin/users' => ['super_admin', 'administrator', 'security_admin'],
            '/api/admin/roles' => ['super_admin', 'administrator', 'security_admin'],
            // manageVendors (vendors.vendors.view holders).
            '/api/admin/vendors' => ['super_admin', 'administrator', 'platform_ops', 'vendor_manager'],
            // manageOrders (orders.orders.view holders).
            '/api/admin/orders' => [
                'super_admin', 'administrator', 'platform_ops', 'orders_admin', 'refund_agent',
                'finance_admin', 'moderator', 'support_agent', 'customer_service', 'vendor_admin',
                'marketplace_admin', 'food_admin',
            ],
            // manageFinance.
            '/api/admin/finance/summary' => ['super_admin', 'administrator', 'finance_admin', 'wallet_admin', 'payout_reviewer'],
            '/api/admin/finance/withdrawals' => ['super_admin', 'administrator', 'finance_admin', 'wallet_admin', 'payout_reviewer'],
            // viewAnalytics.
            '/api/admin/analytics/overview' => ['super_admin', 'administrator', 'analytics_admin', 'analyst', 'finance_admin'],
            // manageCms.
            '/api/admin/cms/pages' => ['super_admin', 'administrator', 'content_manager', 'cms_editor', 'content_admin'],
            // manageSupport.
            '/api/admin/support/tickets' => ['super_admin', 'administrator', 'support_agent', 'customer_service', 'support_admin'],
            // viewAuditLogs (note: administrator intentionally excluded).
            '/api/admin/audit-logs' => ['super_admin', 'security_admin', 'auditor', 'finance_admin'],
            // viewAuditLogs AND audit.logs.export — same allow set; a bare
            // audit.logs.export grant (administrator) is not enough.
            '/api/admin/audit-logs/export' => ['super_admin', 'security_admin', 'auditor'],
            // manageSettings — super_admin + administrator (both hold settings.*).
            '/api/admin/settings' => ['super_admin', 'administrator'],
            // RBAC core — role:super_admin only.
            '/api/admin/rbac/matrix' => ['super_admin'],
            // Departments GET — permission:support.overview.view.
            '/api/admin/departments' => [
                'super_admin', 'administrator', 'customer_service', 'support_agent', 'support_admin',
                'healthcare_admin', 'moderator', 'hotel_admin', 'food_admin',
            ],
            // Brands — role list on the route.
            '/api/admin/brands' => ['super_admin', 'administrator', 'marketplace_admin', 'category_admin'],
            // KYC queue — permission:kyc.applications.view.
            '/api/admin/kyc' => ['super_admin', 'administrator', 'kyc_reviewer', 'security_admin'],
            // Product approval — permission:products.products.approve.
            '/api/admin/products/pending' => ['super_admin', 'administrator', 'platform_ops', 'marketplace_admin', 'moderator'],
            // Disputes / returns read: orders.orders.view; refunds requires
            // an actual refund permission (moderator is view-only here).
            '/api/admin/disputes' => [
                'super_admin', 'administrator', 'moderator', 'finance_admin', 'platform_ops',
                'orders_admin', 'refund_agent', 'support_agent', 'customer_service', 'vendor_admin',
                'marketplace_admin', 'food_admin',
            ],
            '/api/admin/returns' => [
                'super_admin', 'administrator', 'moderator', 'finance_admin', 'platform_ops',
                'orders_admin', 'refund_agent', 'support_agent', 'customer_service', 'vendor_admin',
                'marketplace_admin', 'food_admin',
            ],
            '/api/admin/refunds' => ['super_admin', 'administrator', 'finance_admin', 'platform_ops', 'orders_admin', 'refund_agent'],
            // Wallet ledger — permission:payments.payments.view.
            '/api/admin/wallet/transactions' => ['super_admin', 'administrator', 'finance_admin', 'wallet_admin'],
            // Super+administrator consoles.
            '/api/admin/subscriptions' => ['super_admin', 'administrator'],
            '/api/admin/notifications' => ['super_admin', 'administrator'],
            // Domain consoles.
            '/api/admin/properties' => ['super_admin', 'administrator', 'building_admin', 'real_estate_admin'],
            '/api/admin/pharmacy/orders' => ['super_admin', 'administrator', 'pharmacy_admin', 'healthcare_admin'],
    // H-D: prescriptions oversight read also serves healthcare_admin
    // (holds pharmacy.prescriptions.view) via the Healthcare console.
    '/api/admin/pharmacy/prescriptions' => ['super_admin', 'administrator', 'pharmacy_admin', 'healthcare_admin'],
            '/api/admin/building/bookings' => ['super_admin', 'administrator', 'building_admin'],
            // Inventory stock — permission:inventory.stock.view.
            '/api/stock' => ['super_admin', 'administrator', 'platform_ops', 'inventory_manager', 'vendor_admin'],
            // TODO 21 needs console reads — permission-gated; needs_viewer
            // is read-only triage (every queue visible, all writes denied).
            '/api/admin/needs/overview' => ['super_admin', 'administrator', 'needs_admin', 'needs_viewer', 'platform_ops'],
            '/api/admin/needs/requests' => ['super_admin', 'administrator', 'needs_admin', 'needs_viewer', 'platform_ops'],
            '/api/admin/needs/fraud-flags' => ['super_admin', 'administrator', 'needs_admin', 'needs_viewer', 'platform_ops'],
            // Analytics CSV export — analytics.overview.export (analyst is view-only).
            '/api/admin/analytics/export' => ['super_admin', 'administrator', 'analytics_admin'],
            // Reports — reports.reports.view to read (auditor/analyst hold view;
            // auditor also holds reports.reports.export via reports.*).
            '/api/admin/reports/sales' => ['super_admin', 'administrator', 'analytics_admin', 'auditor', 'analyst'],
            '/api/admin/reports/analytics' => ['super_admin', 'administrator', 'analytics_admin', 'auditor', 'analyst'],
            '/api/admin/reports/export' => ['super_admin', 'administrator', 'analytics_admin', 'auditor'],
        ];
    }

    /** @return array<string, array{string, list<string>, list<string>}> */
    public static function roleProvider(): array
    {
        $out = [];
        foreach (AdminRbacController::ROLES as $role) {
            $allow = [];
            $deny = [];
            foreach (self::probes() as $path => $allowed) {
                if (in_array($role, $allowed, true)) {
                    $allow[] = $path;
                } else {
                    $deny[] = $path;
                }
            }

            $out[$role] = [$role, $allow, $deny];
        }

        return $out;
    }

    #[Test]
    public function test_roster_has_40_roles(): void
    {
        $this->assertCount(40, AdminRbacController::ROLES);
        $this->assertCount(40, array_unique(AdminRbacController::ROLES));
    }

    #[Test]
    #[DataProvider('roleProvider')]
    public function test_role_allows_its_gated_endpoints_and_denies_the_rest(
        string $role,
        array $allow,
        array $deny,
    ): void {
        $user = User::factory()->create();
        $this->assignRole($user, $role);
        $this->actingAs($user, 'sanctum');

        foreach ($allow as $path) {
            $status = $this->getJson($path)->getStatusCode();
            $this->assertNotContains(
                $status,
                [401, 403],
                "{$role} must reach {$path} but got HTTP {$status}",
            );
        }

        foreach ($deny as $path) {
            $status = $this->getJson($path)->getStatusCode();
            $this->assertSame(
                403,
                $status,
                "{$role} must NOT reach {$path} but got HTTP {$status}",
            );
        }
    }

    #[Test]
    public function test_every_probe_is_allowed_to_at_least_one_role(): void
    {
        foreach (self::probes() as $path => $allowed) {
            $this->assertNotEmpty($allowed, "{$path} has no allowed role — gate misread");
        }
    }
}
