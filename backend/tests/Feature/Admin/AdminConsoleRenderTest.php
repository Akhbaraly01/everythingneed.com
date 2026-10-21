<?php

namespace Tests\Feature\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Every admin console page must resolve to its Inertia component for an
 * authorized admin. Route => component (source: routes/web.php admin groups).
 * Role gating per route is enforced separately by AdminAuthorizationMatrixTest.
 */
class AdminConsoleRenderTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{string}> */
    public static function consoleRoutes(): array
    {
        return [
            '/admin' => ['/admin', 'admin/Dashboard'],
            '/admin/dashboard' => ['/admin/dashboard', 'admin/Dashboard'],
            '/admin/approvals' => ['/admin/approvals', 'admin/Approvals'],
            '/admin/categories' => ['/admin/categories', 'admin/Categories'],
            '/admin/category' => ['/admin/category', 'admin/Categories'],
            '/admin/departments' => ['/admin/departments', 'admin/Departments'],
            '/admin/rbac' => ['/admin/rbac', 'admin/Rbac'],
            '/admin/roles' => ['/admin/roles', 'admin/Rbac'],
            '/admin/audit-logs' => ['/admin/audit-logs', 'admin/AuditLogs'],
            '/admin/system' => ['/admin/system', 'admin/System'],
            '/admin/settings' => ['/admin/settings', 'admin/AdminSettings'],
            '/admin/users' => ['/admin/users', 'admin/Users'],
            '/admin/vendors' => ['/admin/vendors', 'admin/Vendors'],
            '/admin/products' => ['/admin/products', 'admin/Products'],
            '/admin/orders' => ['/admin/orders', 'admin/Orders'],
            '/admin/analytics' => ['/admin/analytics', 'admin/Analytics'],
            '/admin/inventory' => ['/admin/inventory', 'admin/Inventory'],
            '/admin/cms' => ['/admin/cms', 'admin/Cms'],
            '/admin/newsletter' => ['/admin/newsletter', 'admin/Newsletter'],
            '/admin/brands' => ['/admin/brands', 'admin/Brands'],
            '/admin/kyc' => ['/admin/kyc', 'admin/Kyc'],
            '/admin/hotels' => ['/admin/hotels', 'admin/Hotels'],
            '/admin/food' => ['/admin/food', 'admin/Food'],
            '/admin/transport' => ['/admin/transport', 'admin/Transport'],
            '/admin/jobs' => ['/admin/jobs', 'admin/Jobs'],
            '/admin/job-seekers' => ['/admin/job-seekers', 'admin/JobSeekers'],
            '/admin/payouts' => ['/admin/payouts', 'admin/Payouts'],
            '/admin/finance' => ['/admin/finance', 'admin/Finance'],
            '/admin/support/tickets' => ['/admin/support/tickets', 'admin/Support'],
            '/admin/healthcare/doctors' => ['/admin/healthcare/doctors', 'admin/Healthcare'],
            '/admin/healthcare/aid' => ['/admin/healthcare/aid', 'admin/HealthcareAid'],
            '/admin/learning/courses' => ['/admin/learning/courses', 'admin/Learning'],
            '/admin/pharmacy' => ['/admin/pharmacy', 'admin/Pharmacy'],
            '/admin/building' => ['/admin/building', 'admin/Building'],
            '/admin/real-estate' => ['/admin/real-estate', 'admin/RealEstate'],
            '/admin/needs' => ['/admin/needs', 'admin/Needs'],
            '/admin/deals' => ['/admin/deals', 'admin/Deals'],
            '/admin/agriculture' => ['/admin/agriculture', 'admin/Agriculture'],
            '/admin/messaging' => ['/admin/messaging', 'admin/Messaging'],
            '/admin/returns' => ['/admin/returns', 'admin/Returns'],
            '/admin/reviews' => ['/admin/reviews', 'admin/Reviews'],
            '/admin/subscriptions' => ['/admin/subscriptions', 'admin/Subscriptions'],
            '/admin/notifications' => ['/admin/notifications', 'admin/Notifications'],
            '/admin/wallet' => ['/admin/wallet', 'admin/Wallet'],
            '/admin/deliveries' => ['/admin/deliveries', 'admin/Deliveries'],
        ];
    }

    #[DataProvider('consoleRoutes')]
    public function test_console_page_renders_its_component(string $path, string $component): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'web')->get($path)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component($component));
    }

    public function test_plain_user_gets_the_web_403_convention_on_console_pages(): void
    {
        $user = $this->createUser();

        foreach (['/admin', '/admin/pharmacy', '/admin/returns', '/admin/users'] as $path) {
            $this->actingAs($user, 'web')->get($path)
                ->assertStatus(302)
                ->assertSessionHas('error');
        }
    }

    public function test_guest_is_sent_to_login_from_console_pages(): void
    {
        $this->get('/admin/dashboard')
            ->assertRedirect(route('login'));
    }
}
