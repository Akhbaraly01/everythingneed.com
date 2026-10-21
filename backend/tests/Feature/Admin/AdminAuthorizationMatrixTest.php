<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AdminAuthorizationMatrixTest extends TestCase
{
    /**
     * Canonical role => pages the role must reach / must be refused.
     * Mirrors ADMIN_WORKSPACE_AUTHORIZATION_MATRIX.md; server middleware is
     * the authority under test (navigation is UX only).
     */
    private const MATRIX = [
        'super_admin' => [
            'allow' => [
                '/admin/dashboard', '/admin/users', '/admin/rbac', '/admin/system', '/admin/audit-logs',
                '/admin/brands', '/admin/newsletter', '/admin/kyc', '/admin/inventory',
                '/admin/pharmacy', '/admin/building', '/admin/real-estate', '/admin/returns', '/admin/reviews',
                '/admin/subscriptions', '/admin/notifications', '/admin/wallet', '/admin/deliveries',
                '/admin/reports', '/admin/agriculture', '/admin/deals', '/admin/messaging',
            ],
            'deny' => [],
        ],
        'administrator' => [
            'allow' => [
                '/admin/dashboard', '/admin/users', '/admin/cms', '/admin/finance', '/admin/orders',
                '/admin/brands', '/admin/newsletter', '/admin/kyc', '/admin/inventory',
                '/admin/pharmacy', '/admin/building', '/admin/real-estate', '/admin/returns', '/admin/reviews',
                '/admin/subscriptions', '/admin/notifications', '/admin/wallet', '/admin/deliveries',
                // W5: administrator holds settings.* in the role matrix, so the
                // Settings/System gates now match the matrix (nav declares
                // settings.system.update).
                '/admin/settings', '/admin/system',
                // W5.4: administrator holds reports.* in the role matrix.
                '/admin/reports', '/admin/agriculture', '/admin/deals', '/admin/messaging',
            ],
            'deny' => ['/admin/rbac', '/admin/audit-logs'],
        ],
        'finance_admin' => [
            'allow' => ['/admin/dashboard', '/admin/finance', '/admin/payouts', '/admin/wallet', '/admin/returns'],
            'deny' => ['/admin/users', '/admin/rbac', '/admin/reviews'],
        ],
        'healthcare_admin' => [
            'allow' => ['/admin/dashboard', '/admin/healthcare/doctors', '/admin/healthcare/aid'],
            'deny' => ['/admin/learning/courses', '/admin/users'],
        ],
        'learning_admin' => [
            'allow' => ['/admin/dashboard', '/admin/learning/courses'],
            'deny' => ['/admin/healthcare/doctors', '/admin/users'],
        ],
        'learning_reviewer' => [
            'allow' => ['/admin/dashboard', '/admin/learning/review'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/kyc'],
        ],
        'support_agent' => [
            'allow' => ['/admin/dashboard', '/admin/support/tickets', '/admin/departments'],
            'deny' => ['/admin/users', '/admin/finance'],
        ],
        'customer_service' => [
            'allow' => ['/admin/dashboard', '/admin/support/tickets', '/admin/departments'],
            'deny' => ['/admin/users', '/admin/finance'],
        ],
        'content_manager' => [
            'allow' => ['/admin/dashboard', '/admin/cms', '/admin/newsletter'],
            'deny' => ['/admin/users', '/admin/approvals', '/admin/kyc', '/admin/reports'],
        ],
        'marketplace_admin' => [
            'allow' => ['/admin/dashboard', '/admin/approvals', '/admin/categories', '/admin/brands'],
            'deny' => ['/admin/users', '/admin/cms', '/admin/kyc'],
        ],
        'moderator' => [
            'allow' => ['/admin/dashboard', '/admin/approvals', '/admin/categories', '/admin/returns', '/admin/reviews'],
            'deny' => ['/admin/users', '/admin/cms', '/admin/wallet'],
        ],
        'hotel_admin' => [
            'allow' => ['/admin/dashboard', '/admin/hotels'],
            'deny' => ['/admin/food', '/admin/users'],
        ],
        'food_admin' => [
            'allow' => ['/admin/dashboard', '/admin/food'],
            'deny' => ['/admin/hotels', '/admin/users'],
        ],
        'transport_admin' => [
            'allow' => ['/admin/dashboard', '/admin/transport', '/admin/deliveries'],
            'deny' => ['/admin/jobs', '/admin/users'],
        ],
        'jobs_admin' => [
            'allow' => ['/admin/dashboard', '/admin/jobs'],
            'deny' => ['/admin/transport', '/admin/users'],
        ],
        'pharmacy_admin' => [
            'allow' => ['/admin/dashboard', '/admin/pharmacy'],
            'deny' => ['/admin/users', '/admin/finance'],
        ],
        'agriculture_admin' => [
            'allow' => ['/admin/dashboard', '/admin/agriculture'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/deals', '/admin/messaging'],
        ],
        'building_admin' => [
            'allow' => ['/admin/dashboard', '/admin/building', '/admin/real-estate'],
            'deny' => ['/admin/users', '/admin/finance'],
        ],
        'kyc_reviewer' => [
            'allow' => ['/admin/dashboard', '/admin/kyc'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/inventory'],
        ],
        'worker' => [
            'allow' => [],
            'deny' => ['/admin/dashboard', '/admin/users'],
        ],
        'vendor_admin' => [
            'allow' => [],
            'deny' => ['/admin/dashboard', '/admin/users'],
        ],
        'user' => [
            'allow' => [],
            'deny' => ['/admin/dashboard', '/admin/users'],
        ],
        // W1.8 — the remaining 14 roster roles (full 35-role coverage at the
        // time; spec §65 roles below bring the roster to 38).
        'platform_ops' => [
            'allow' => [
                '/admin/dashboard', '/admin/approvals', '/admin/categories', '/admin/vendors',
                '/admin/products', '/admin/inventory', '/admin/orders', '/admin/returns',
                '/admin/deliveries',
            ],
            'deny' => ['/admin/users', '/admin/rbac', '/admin/finance', '/admin/cms', '/admin/kyc', '/admin/audit-logs', '/admin/settings', '/admin/reports'],
        ],
        'security_admin' => [
            'allow' => ['/admin/dashboard', '/admin/users', '/admin/kyc', '/admin/audit-logs'],
            'deny' => ['/admin/finance', '/admin/orders', '/admin/cms', '/admin/categories', '/admin/rbac', '/admin/settings', '/admin/system'],
        ],
        'analytics_admin' => [
            'allow' => ['/admin/dashboard', '/admin/analytics', '/admin/reports'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/cms', '/admin/kyc'],
        ],
        'orders_admin' => [
            'allow' => ['/admin/dashboard', '/admin/orders', '/admin/returns', '/admin/deliveries'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/categories', '/admin/kyc', '/admin/cms'],
        ],
        'wallet_admin' => [
            'allow' => ['/admin/dashboard', '/admin/payouts', '/admin/wallet'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/categories', '/admin/kyc'],
        ],
        'support_admin' => [
            'allow' => ['/admin/dashboard', '/admin/support/tickets', '/admin/departments', '/admin/messaging'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/categories', '/admin/deals', '/admin/agriculture'],
        ],
        'real_estate_admin' => [
            'allow' => ['/admin/dashboard', '/admin/real-estate'],
            'deny' => ['/admin/building', '/admin/users', '/admin/finance', '/admin/orders'],
        ],
        'needs_admin' => [
            'allow' => ['/admin/dashboard', '/admin/needs'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/categories', '/admin/kyc'],
        ],
        'needs_viewer' => [
            'allow' => ['/admin/dashboard', '/admin/needs'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/categories', '/admin/kyc', '/admin/rbac'],
        ],
        'payout_reviewer' => [
            'allow' => ['/admin/dashboard', '/admin/payouts'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/wallet', '/admin/orders'],
        ],
        'refund_agent' => [
            'allow' => ['/admin/dashboard', '/admin/orders', '/admin/returns'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/payouts', '/admin/categories'],
        ],
        'inventory_manager' => [
            'allow' => ['/admin/dashboard', '/admin/inventory'],
            'deny' => ['/admin/users', '/admin/orders', '/admin/finance', '/admin/categories'],
        ],
        'cms_editor' => [
            'allow' => ['/admin/dashboard', '/admin/cms', '/admin/newsletter'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/categories', '/admin/kyc'],
        ],
        'auditor' => [
            'allow' => ['/admin/dashboard', '/admin/audit-logs', '/admin/reports'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/categories', '/admin/kyc'],
        ],
        'analyst' => [
            'allow' => ['/admin/dashboard', '/admin/analytics', '/admin/reports'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/categories', '/admin/kyc'],
        ],
        // Spec §65 named admin roles (full 40-role coverage since TODO 21).
        'category_admin' => [
            'allow' => ['/admin/dashboard', '/admin/categories', '/admin/category', '/admin/brands'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/kyc', '/admin/cms', '/admin/approvals'],
        ],
        'vendor_manager' => [
            'allow' => ['/admin/dashboard', '/admin/vendors'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/products', '/admin/kyc', '/admin/cms'],
        ],
        'content_admin' => [
            'allow' => ['/admin/dashboard', '/admin/cms', '/admin/newsletter'],
            'deny' => ['/admin/users', '/admin/finance', '/admin/orders', '/admin/kyc', '/admin/categories'],
        ],
    ];

    public function test_matrix_covers_the_full_40_role_roster(): void
    {
        $this->assertEqualsCanonicalizing(
            \Modules\Admin\Http\Controllers\AdminRbacController::ROLES,
            array_keys(self::MATRIX),
            'every roster role must have a page allow/deny suite (W1.8)',
        );
    }

    protected function setUp(): void
    {
        parent::setUp();

        // Permission-gated pages (learn.*, settings.*, ...) resolve through
        // EffectivePermissionResolver -> role_permissions; without the seeded
        // matrix the allow side of the matrix would 403 for non-super roles.
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
        \Illuminate\Support\Facades\Cache::forget('rbac.catalog');
    }

    public function test_role_matrix_is_enforced_by_server_middleware(): void
    {
        foreach (self::MATRIX as $role => $expectations) {
            // The global IP rate limiter allows 240 req/min; this single test
            // method fires more than that once the matrix grows, so reset the
            // counter per role to keep the limiter itself under test elsewhere.
            \Illuminate\Support\Facades\RateLimiter::clear('global:127.0.0.1');

            $user = User::factory()->create();
            UserRole::create(['user_id' => $user->id, 'role' => $role]);

            foreach ($expectations['allow'] as $path) {
                $this->actingAs($user, 'web')
                    ->get($path)
                    ->assertOk("{$role} must reach {$path}");
            }

            // Web denials bounce authenticated users to their own workspace
            // with an error flash (never back onto the forbidden URL).
            $landing = app(\Core\Services\Contracts\WorkspaceResolverInterface::class)
                ->landingPath($user);

            foreach ($expectations['deny'] as $path) {
                $this->actingAs($user, 'web')
                    ->get($path)
                    ->assertRedirect($landing, "{$role} must not reach {$path}")
                    ->assertSessionHas('error');
            }
        }
    }

    public function test_registry_covers_every_admin_route(): void
    {
        $ts = (string) file_get_contents(resource_path('js/config/consoleNavigation.ts'));

        // Canonical navigation entries.
        preg_match_all("#href:\s*'(/admin[^']*)'#", $ts, $navMatches);
        $registry = $navMatches[1];

        // Documented aliases are routable hrefs too (keys of the alias map).
        preg_match_all("#'(/admin[^']*)'\s*:\s*'/admin[^']*'#", $ts, $aliasMatches);
        $registry = array_merge($registry, $aliasMatches[1]);
        $registry = array_values(array_unique($registry));

        // Every concrete /admin GET route (no path params).
        $routeUris = [];
        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (str_starts_with($uri, 'admin') && ! str_contains($uri, '{')) {
                $routeUris[] = '/'.ltrim($uri, '/');
            }
        }
        $routeUris = array_values(array_unique($routeUris));

        sort($registry);
        sort($routeUris);

        $this->assertSame(
            $routeUris,
            $registry,
            'consoleNavigation.ts admin registry must exactly mirror routes/web.php admin routes (nav entries + documented aliases).'
        );
    }

    public function test_every_registry_href_is_role_or_permission_gated(): void
    {
        $ts = (string) file_get_contents(resource_path('js/config/consoleNavigation.ts'));
        preg_match_all("#href:\s*'(/admin[^']*)'#", $ts, $m);

        foreach ($m[1] as $href) {
            $path = ltrim($href, '/');
            $route = Route::getRoutes()->match(\Illuminate\Http\Request::create('/'.$path, 'GET'));

            $gated = collect($route->gatherMiddleware())
                ->contains(fn ($middleware) => is_string($middleware)
                    && (str_starts_with($middleware, 'role:') || str_starts_with($middleware, 'permission:')));

            $this->assertTrue($gated, "{$href} must carry a role: or permission: middleware");
        }
    }
}
