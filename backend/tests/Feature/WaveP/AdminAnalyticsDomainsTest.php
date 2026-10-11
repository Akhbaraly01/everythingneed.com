<?php

namespace Tests\Feature\WaveP;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Wave P — spec 63: admin analytics domains endpoint — per-domain daily
 * series + conversion funnel, range handling, and the viewAnalytics gate.
 */
class AdminAnalyticsDomainsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    public function test_super_admin_gets_all_series_and_the_funnel(): void
    {
        $this->actingAsAdmin();

        $res = $this->getJson('/api/admin/analytics/domains?range=30d')->assertOk();

        $this->assertSame('30d', $res->json('data.range'));
        $this->assertSame(now()->subDays(30)->toDateString(), $res->json('data.since'));

        $series = $res->json('data.series');
        foreach (['orders', 'bookings', 'healthcare', 'learning', 'needs', 'services', 'wallet', 'payments'] as $metric) {
            $this->assertArrayHasKey($metric, $series, "Missing series {$metric}.");
        }

        $funnel = $res->json('data.funnel');
        $this->assertCount(3, $funnel['steps']);
        $this->assertSame(['Signed up', 'Orders created', 'Payments succeeded'], array_column($funnel['steps'], 'label'));
        $this->assertArrayHasKey('signup_to_order_rate', $funnel);
        $this->assertArrayHasKey('order_to_paid_rate', $funnel);

        foreach ($funnel['steps'] as $step) {
            $this->assertIsInt($step['value']);
        }
        // Rates are numbers (JSON turns 0.0 into 0) or null when the
        // denominator is zero — never a string.
        $this->assertTrue(
            is_numeric($funnel['signup_to_order_rate']) || is_null($funnel['signup_to_order_rate'])
        );
        $this->assertTrue(
            is_numeric($funnel['order_to_paid_rate']) || is_null($funnel['order_to_paid_rate'])
        );
    }

    public function test_default_and_unknown_ranges_fall_back_to_30d(): void
    {
        $this->actingAsAdmin();

        $default = $this->getJson('/api/admin/analytics/domains')->assertOk();
        $this->assertSame('30d', $default->json('data.range'));

        $bogus = $this->getJson('/api/admin/analytics/domains?range=99d')->assertOk();
        $this->assertSame('30d', $bogus->json('data.range'));

        $week = $this->getJson('/api/admin/analytics/domains?range=7d')->assertOk();
        $this->assertSame('7d', $week->json('data.range'));
        $this->assertSame(now()->subDays(7)->toDateString(), $week->json('data.since'));
    }

    public function test_plain_user_is_forbidden(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/admin/analytics/domains')->assertStatus(403);
    }

    public function test_guest_is_unauthorised(): void
    {
        $this->getJson('/api/admin/analytics/domains')->assertStatus(401);
    }
}
