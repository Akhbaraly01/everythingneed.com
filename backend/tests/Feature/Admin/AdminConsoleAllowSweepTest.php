<?php

namespace Tests\Feature\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Every admin console section must be reachable by the role that owns it
 * and unreachable by everyone else. One row per web group in routes/web.php
 * plus the other-module api/admin/* families: the listed role gets 200,
 * a plain user gets bounced (302 web / 401-404 API - never 200, never 500).
 */
class AdminConsoleAllowSweepTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, list<string>> path => roles that must reach it */
    private function webGroups(): array
    {
        return [
            '/admin/dashboard' => ['super_admin', 'platform_ops', 'support_agent'],
            '/admin' => ['super_admin'],
            '/admin/approvals' => ['super_admin', 'moderator'],
            '/admin/categories' => ['super_admin', 'category_admin'],
            '/admin/departments' => ['super_admin', 'support_agent'],
            '/admin/audit-logs' => ['super_admin', 'security_admin'],
            '/admin/rbac' => ['super_admin'],
            '/admin/system' => ['super_admin', 'administrator'],
            '/admin/settings' => ['super_admin', 'administrator'],
            '/admin/users' => ['super_admin', 'security_admin'],
            '/admin/analytics' => ['super_admin', 'analyst'],
            '/admin/reports' => ['super_admin', 'auditor'],
            '/admin/vendors' => ['super_admin', 'vendor_manager'],
            '/admin/products' => ['super_admin', 'platform_ops'],
            '/admin/inventory' => ['super_admin', 'inventory_manager'],
            '/admin/orders' => ['super_admin', 'orders_admin'],
            '/admin/cms' => ['super_admin', 'content_manager'],
            '/admin/home-sections' => ['super_admin', 'cms_editor'],
            '/admin/newsletter' => ['super_admin', 'content_admin'],
            '/admin/navigation' => ['super_admin', 'cms_editor'],
            '/admin/media' => ['super_admin', 'content_manager'],
            '/admin/modules' => ['super_admin', 'content_manager'],
            '/admin/forms' => ['super_admin', 'content_manager'],
            '/admin/services' => ['super_admin', 'administrator'],
            '/admin/category' => ['super_admin', 'marketplace_admin'],
            '/admin/brands' => ['super_admin', 'marketplace_admin'],
            '/admin/kyc' => ['super_admin', 'kyc_reviewer'],
            '/admin/hotels' => ['super_admin', 'hotel_admin'],
            '/admin/food' => ['super_admin', 'food_admin'],
            '/admin/transport' => ['super_admin', 'transport_admin'],
            '/admin/jobs' => ['super_admin', 'jobs_admin'],
            '/admin/job-seekers' => ['super_admin', 'jobs_admin'],
            '/admin/payouts' => ['super_admin', 'finance_admin'],
            '/admin/finance' => ['super_admin', 'finance_admin'],
            '/admin/support/tickets' => ['super_admin', 'customer_service'],
            '/admin/healthcare/doctors' => ['super_admin', 'healthcare_admin'],
            '/admin/healthcare/aid' => ['super_admin', 'healthcare_admin'],
            '/admin/learning/courses' => ['super_admin', 'learning_admin'],
            '/admin/learning/review' => ['super_admin', 'learning_reviewer'],
            '/admin/pharmacy' => ['super_admin', 'pharmacy_admin'],
            '/admin/building' => ['super_admin', 'building_admin'],
            '/admin/real-estate' => ['super_admin', 'real_estate_admin'],
            '/admin/needs' => ['super_admin', 'needs_admin', 'needs_viewer'],
            '/admin/deals' => ['super_admin', 'administrator'],
            '/admin/agriculture' => ['super_admin', 'agriculture_admin'],
            '/admin/messaging' => ['super_admin', 'support_admin'],
            '/admin/returns' => ['super_admin', 'refund_agent'],
            '/admin/reviews' => ['super_admin', 'moderator'],
            '/admin/subscriptions' => ['super_admin', 'administrator'],
            '/admin/notifications' => ['super_admin', 'administrator'],
            '/admin/wallet' => ['super_admin', 'wallet_admin'],
            '/admin/deliveries' => ['super_admin', 'orders_admin'],
        ];
    }

    private function userWithRole(string $role)
    {
        $user = $role === 'super_admin' ? $this->createAdmin() : $this->createUser();
        if ($role !== 'super_admin') {
            $this->assignRole($user, $role);
        }

        return $user;
    }

    public function test_console_sections_open_for_their_roles_and_bounce_plain_users(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);

        $plain = $this->createUser();
        $failures = [];
        $checked = 0;

        foreach ($this->webGroups() as $path => $roles) {
            foreach ($roles as $role) {
                $checked++;
                $user = $this->userWithRole($role);
                $res = $this->actingAs($user, 'web')->get($path);
                if ($res->getStatusCode() !== 200) {
                    $failures[] = "{$path} as {$role} => {$res->getStatusCode()} (want 200)";
                }
            }

            $denied = $this->actingAs($plain, 'web')->get($path);
            if ($denied->getStatusCode() === 200) {
                $failures[] = "{$path} rendered 200 for a plain user";
            }
            if ($denied->getStatusCode() >= 500) {
                $failures[] = "{$path} for plain user => {$denied->getStatusCode()}";
            }
        }

        $this->assertSame([], $failures, "{$checked} role-page probes, failures:\n" . implode("\n", $failures));
    }

    public function test_other_module_admin_apis_open_for_their_roles(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);

        // path => [roles that must NOT see 401/403/500, roles that must be refused]
        $probes = [
            '/api/admin/restaurants' => [['food_admin'], ['jobs_admin']],
            '/api/admin/jobs' => [['jobs_admin'], ['food_admin']],
            '/api/admin/hotels' => [['hotel_admin'], ['food_admin']],
            '/api/admin/healthcare/tickets' => [['healthcare_admin'], ['food_admin']],
            '/api/admin/services' => [['administrator'], ['food_admin']],
            '/api/admin/reviews' => [['moderator'], ['food_admin']],
            '/api/admin/transport/rides' => [['transport_admin'], ['food_admin']],
            '/api/admin/pharmacy/orders' => [['pharmacy_admin'], ['food_admin']],
            '/api/admin/courses' => [['learning_admin'], ['food_admin']],
            '/api/admin/job-seekers' => [['jobs_admin'], ['food_admin']],
            '/api/admin/work-requests' => [['jobs_admin'], ['food_admin']],
            '/api/admin/agriculture/overview' => [['agriculture_admin'], ['food_admin']],
            '/api/admin/deals' => [['administrator'], ['food_admin']],
            '/api/admin/messaging/conversations' => [['support_admin'], ['food_admin']],
            '/api/admin/notifications/audiences' => [['administrator'], ['food_admin']],
        ];

        $failures = [];
        foreach ($probes as $path => [$allowed, $refused]) {
            foreach ($allowed as $role) {
                $user = $this->userWithRole($role);
                $res = $this->actingAs($user, 'sanctum')->getJson($path);
                if (in_array($res->getStatusCode(), [401, 403, 500], true)) {
                    $failures[] = "{$path} as {$role} => {$res->getStatusCode()}";
                }
            }
            foreach ($refused as $role) {
                $user = $this->userWithRole($role);
                $res = $this->actingAs($user, 'sanctum')->getJson($path);
                if ($res->getStatusCode() === 200) {
                    $failures[] = "{$path} rendered 200 for {$role}";
                }
            }
        }

        $this->assertSame([], $failures, "Other-module admin API probes:\n" . implode("\n", $failures));
    }
}
