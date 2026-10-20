<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W1 recall contract: every admin console role can actually load its own
 * console's primary API data — page 200 + API 403 leaks are a regression.
 *
 * The endpoint map mirrors the fetches each admin page makes for its
 * landing role (routes/web.php groups vs module route gates). GET-only:
 * mutation contracts are pinned by the domain-specific suites.
 */
class AdminConsoleApiParityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    /**
     * role => primary GET endpoints of the console that role lands on.
     *
     * @return array<string, array<int, string>>
     */
    private static function consoleMap(): array
    {
        return [
            'super_admin' => [
                '/api/admin/stats', '/api/admin/settings', '/api/admin/rbac/matrix',
                '/api/admin/users', '/api/admin/orders', '/api/admin/audit-logs',
            ],
            'administrator' => [
                '/api/admin/users', '/api/admin/roles', '/api/admin/orders',
                '/api/admin/finance/summary', '/api/admin/support/tickets',
                '/api/admin/cms/pages', '/api/admin/analytics/overview',
                '/api/admin/vendors', '/api/admin/returns', '/api/admin/disputes',
                '/api/admin/refunds', '/api/admin/wallet/transactions', '/api/admin/kyc',
            ],
            'platform_ops' => [
                '/api/admin/orders', '/api/admin/vendors', '/api/admin/returns',
                '/api/admin/disputes', '/api/admin/refunds', '/api/stock',
                '/api/delivery/managers',
            ],
            'security_admin' => [
                '/api/admin/users', '/api/admin/kyc', '/api/admin/audit-logs',
            ],
            'analytics_admin' => ['/api/admin/analytics/overview', '/api/admin/analytics/revenue', '/api/admin/analytics/domains'],
            'moderator' => [
                '/api/admin/products/pending', '/api/admin/disputes',
                '/api/admin/returns', '/api/reviews',
            ],
            'marketplace_admin' => [
                '/api/admin/products/pending', '/api/admin/brands', '/api/categories',
            ],
            'orders_admin' => [
                '/api/admin/orders', '/api/admin/returns', '/api/admin/disputes',
                '/api/admin/refunds',
            ],
            'wallet_admin' => ['/api/admin/wallet/transactions', '/api/admin/finance/withdrawals'],
            'support_admin' => ['/api/admin/support/tickets', '/api/admin/departments'],
            'real_estate_admin' => ['/api/admin/properties'],
            'payout_reviewer' => ['/api/admin/finance/withdrawals'],
            'refund_agent' => ['/api/admin/orders', '/api/admin/refunds'],
            'inventory_manager' => ['/api/stock'],
            'cms_editor' => ['/api/admin/cms/pages', '/api/newsletter/subscriptions'],
            'auditor' => ['/api/admin/audit-logs'],
            'analyst' => ['/api/admin/analytics/overview'],
            'kyc_reviewer' => ['/api/admin/kyc'],
            'content_manager' => ['/api/admin/cms/pages', '/api/newsletter/subscriptions'],
            'finance_admin' => [
                '/api/admin/finance/summary', '/api/admin/finance/withdrawals',
                '/api/admin/wallet/transactions', '/api/admin/refunds',
            ],
            'customer_service' => ['/api/admin/support/tickets', '/api/admin/departments'],
            'support_agent' => ['/api/admin/support/tickets', '/api/admin/departments'],
            'healthcare_admin' => [
                '/api/admin/healthcare/tickets', '/api/admin/healthcare/consultations', '/api/doctors',
                '/api/admin/healthcare/aid', '/api/admin/healthcare/labs', '/api/admin/healthcare/labs/bookings',
                '/api/admin/healthcare/service-requests', '/api/admin/healthcare/content',
                '/api/admin/pharmacy/prescriptions',
            ],
            'learning_admin' => ['/api/courses'],
            'hotel_admin' => ['/api/admin/hotels'],
            'food_admin' => ['/api/admin/restaurants'],
            'transport_admin' => ['/api/admin/transport/rides', '/api/admin/transport/flights'],
            'jobs_admin' => ['/api/admin/jobs', '/api/admin/job-seekers', '/api/admin/work-requests'],
            'pharmacy_admin' => ['/api/admin/pharmacy/orders', '/api/medicines'],
            'building_admin' => ['/api/admin/building/bookings', '/api/admin/properties'],
            // Dashboard-only consoles (server-rendered cards, no page API).
            'needs_admin' => [],
            'agriculture_admin' => [],
            // Spec §65 named admin roles.
            'category_admin' => ['/api/categories', '/api/admin/brands'],
            'vendor_manager' => ['/api/admin/vendors'],
            'content_admin' => ['/api/admin/cms/pages', '/api/newsletter/subscriptions'],
        ];
    }

    /** @return array<string, array{string, array<int, string>}> */
    public static function consoleProvider(): array
    {
        $out = [];
        foreach (self::consoleMap() as $role => $paths) {
            $out[$role] = [$role, $paths];
        }

        return $out;
    }

    #[Test]
    #[DataProvider('consoleProvider')]
    public function test_console_role_can_load_its_own_console_data(string $role, array $paths): void
    {
        if ($paths === []) {
            $this->assertTrue(true, "{$role} lands on the dashboard (no console API to probe)");

            return;
        }

        $user = $this->createUser();
        $this->assignRole($user, $role);
        $this->actingAs($user, 'sanctum');

        foreach ($paths as $path) {
            $status = $this->getJson($path)->getStatusCode();
            $this->assertNotContains(
                $status,
                [401, 403],
                "{$role} must reach {$path} but got HTTP {$status}",
            );
        }
    }

    #[Test]
    public function test_non_console_roles_are_still_forbidden(): void
    {
        $user = $this->createUser();
        $this->assignRole($user, 'user');
        $this->actingAs($user, 'sanctum');

        foreach (['/api/admin/orders', '/api/admin/users', '/api/admin/finance/summary'] as $path) {
            $this->getJson($path)->assertForbidden();
        }
    }
}
