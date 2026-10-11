<?php

namespace Tests\Feature\Admin;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Products\Entities\Product;
use Tests\TestCase;

/**
 * W5.3 — analytics range honoured end to end, CSV export permission gate,
 * and the customer "My Analytics" personal summary.
 */
class AdminAnalyticsRangeExportTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function backdate(string $userId, \DateTimeInterface $when): void
    {
        DB::table('users')->where('id', $userId)->update(['created_at' => $when]);
    }

    private function insertSucceededPayment(string $userId, float $amount, \DateTimeInterface $when): void
    {
        DB::table('payments')->insert([
            'id'         => (string) Str::uuid(),
            'user_id'    => $userId,
            'amount'     => $amount,
            'method'     => 'card',
            'reference'  => 'ref-'.Str::random(12),
            'status'     => 'succeeded',
            'created_at' => $when,
            'updated_at' => $when,
        ]);
    }

    private function insertOrder(string $userId, string $status, float $total, \DateTimeInterface $when): void
    {
        DB::table('orders')->insert([
            'id'             => (string) Str::uuid(),
            'user_id'        => $userId,
            'order_number'   => 'ON-'.Str::random(12),
            'status'         => $status,
            'total_amount'   => $total,
            'shipping_address' => '1 Test Street',
            'created_at'     => $when,
            'updated_at'     => $when,
        ]);
    }

    public function test_overview_window_follows_selected_range(): void
    {
        $old = $this->createUser();
        $this->backdate($old->id, now()->subDays(60));
        $this->insertSucceededPayment($old->id, 500, now()->subDays(60));

        $fresh = $this->createUser();
        $this->insertSucceededPayment($fresh->id, 50, now()->subDays(1));

        $viewer = $this->createUser();
        $this->assignRole($viewer, 'analytics_admin');
        $this->actingAs($viewer, 'sanctum');

        // 7d window: the two recently-created users only, recent payment only.
        $week = $this->getJson('/api/admin/analytics/overview?range=7d')->assertOk();
        $this->assertSame('7d', $week->json('data.range'));
        $this->assertSame(2, $week->json('data.new_users'));
        $this->assertEqualsWithDelta(50.0, (float) $week->json('data.total_revenue'), 0.01);
    }

    public function test_overview_90d_includes_backdated_rows(): void
    {
        $old = $this->createUser();
        $this->backdate($old->id, now()->subDays(60));
        $this->insertSucceededPayment($old->id, 500, now()->subDays(60));
        $this->createUser();

        $viewer = $this->createUser();
        $this->assignRole($viewer, 'analytics_admin');
        $this->actingAs($viewer, 'sanctum');

        $ninety = $this->getJson('/api/admin/analytics/overview?range=90d')->assertOk();
        $this->assertSame(3, $ninety->json('data.new_users'));
        $this->assertEqualsWithDelta(500.0, (float) $ninety->json('data.total_revenue'), 0.01);

        // Stock gauges stay all-time regardless of range.
        $this->assertSame(3, $ninety->json('data.total_users'));
    }

    public function test_unknown_range_falls_back_to_30d(): void
    {
        $old = $this->createUser();
        $this->backdate($old->id, now()->subDays(60));

        $viewer = $this->createUser();
        $this->assignRole($viewer, 'analytics_admin');
        $this->actingAs($viewer, 'sanctum');

        $default = $this->getJson('/api/admin/analytics/overview')->assertOk();
        $this->assertSame('30d', $default->json('data.range'));
        $this->assertSame(1, $default->json('data.new_users'));

        $bogus = $this->getJson('/api/admin/analytics/overview?range=anything_goes')->assertOk();
        $this->assertSame('30d', $bogus->json('data.range'));
        $this->assertSame(1, $bogus->json('data.new_users'));
    }

    public function test_series_endpoints_honour_range(): void
    {
        $old = $this->createUser();
        $backdated = now()->subDays(60)->toDateString();
        $this->backdate($old->id, now()->subDays(60));
        $this->createUser();

        $viewer = $this->createUser();
        $this->assignRole($viewer, 'analytics_admin');
        $this->actingAs($viewer, 'sanctum');

        $weekLabels = array_column($this->getJson('/api/admin/analytics/user-growth?range=7d')->assertOk()->json('data'), 'label');
        $this->assertNotContains($backdated, $weekLabels);

        $ninetyLabels = array_column($this->getJson('/api/admin/analytics/user-growth?range=90d')->assertOk()->json('data'), 'label');
        $this->assertContains($backdated, $ninetyLabels);
    }

    public function test_categories_breakdown_returns_plain_array(): void
    {
        // Regression (W7): productCategoryBreakdown() declared `: array` but
        // returned a Collection -> TypeError -> 500, which failed the analytics
        // page's Promise.all ("Failed to load analytics"). No API test had ever
        // hit this endpoint; the new E2E console sweep caught it live.
        $vendor = $this->createVendor($this->createUser());
        Product::factory()->create(['vendor_id' => $vendor->id, 'category' => 'electronics', 'is_active' => true]);
        Product::factory()->create(['vendor_id' => $vendor->id, 'category' => 'electronics', 'is_active' => true]);
        Product::factory()->create(['vendor_id' => $vendor->id, 'category' => 'clothing', 'is_active' => true]);
        Product::factory()->create(['vendor_id' => $vendor->id, 'category' => 'hidden', 'is_active' => false]);

        $viewer = $this->createUser();
        $this->assignRole($viewer, 'analytics_admin');
        $this->actingAs($viewer, 'sanctum');

        $res = $this->getJson('/api/admin/analytics/categories')->assertOk();
        $rows = $res->json('data');
        $this->assertIsArray($rows);

        $byLabel = array_column($rows, 'value', 'label');
        $this->assertSame(2, (int) ($byLabel['electronics'] ?? 0));
        $this->assertSame(1, (int) ($byLabel['clothing'] ?? 0));
        $this->assertArrayNotHasKey('hidden', $byLabel);
    }

    public function test_export_gate_and_csv_content(): void
    {
        // Guest: 401 before any permission check.
        $this->getJson('/api/admin/analytics/export')->assertUnauthorized();

        // Analyst can view the overview but not export it.
        $analyst = $this->createUser();
        $this->assignRole($analyst, 'analyst');
        $this->actingAs($analyst, 'sanctum');
        $this->getJson('/api/admin/analytics/export')->assertForbidden();

        // analytics_admin holds analytics.overview.export.
        $exporter = $this->createUser();
        $this->assignRole($exporter, 'analytics_admin');
        $this->actingAs($exporter, 'sanctum');

        $res = $this->get('/api/admin/analytics/export?range=7d');
        $res->assertOk();
        $this->assertStringContainsString('text/csv', (string) $res->headers->get('Content-Type'));
        $this->assertStringContainsString(
            'everythingneed-analytics-7d-',
            (string) $res->headers->get('Content-Disposition'),
        );

        $csv = $res->streamedContent();
        $this->assertStringContainsString('range,7d', $csv);
        $this->assertStringContainsString('metric,value', $csv);
        $this->assertStringContainsString('new_users', $csv);
        $this->assertStringContainsString('date,new_users,revenue,traffic_events', $csv);
    }

    public function test_administrator_can_export_too(): void
    {
        $admin = $this->createUser();
        $this->assignRole($admin, 'administrator');
        $this->actingAs($admin, 'sanctum');

        $this->get('/api/admin/analytics/export')->assertOk();
    }

    public function test_analytics_web_page_requires_login(): void
    {
        $res = $this->get('/analytics');
        $res->assertRedirect();
        $this->assertStringContainsString('/login', (string) $res->headers->get('Location'));

        $user = $this->createUser();
        $this->actingAs($user, 'web');
        $this->get('/analytics')->assertOk();
    }

    public function test_my_summary_returns_own_stats_only(): void
    {
        $this->getJson('/api/analytics/my-summary')->assertUnauthorized();

        $me = $this->createUser();
        $other = $this->createUser();

        $this->insertOrder($me->id, 'paid', 100, now()->subDays(40));
        $this->insertOrder($me->id, 'delivered', 60, now()->subDays(2));
        $this->insertOrder($me->id, 'cancelled', 999, now());
        $this->insertOrder($other->id, 'paid', 500, now());

        DB::table('analytics_events')->insert([
            'id'         => (string) Str::uuid(),
            'user_id'    => $me->id,
            'event_type' => 'page_view',
            'created_at' => now()->subDay(),
        ]);
        DB::table('analytics_events')->insert([
            'id'         => (string) Str::uuid(),
            'user_id'    => $other->id,
            'event_type' => 'page_view',
            'created_at' => now()->subDay(),
        ]);

        $this->actingAs($me, 'sanctum');
        $res = $this->getJson('/api/analytics/my-summary')->assertOk();

        $this->assertSame(3, $res->json('data.total_orders'));
        // Cancelled order excluded from spend; the other user never counted.
        $this->assertEqualsWithDelta(160.0, (float) $res->json('data.total_spent'), 0.01);
        $this->assertSame(0, $res->json('data.total_wishlist'));
        $this->assertSame(1, $res->json('data.recent_views'));

        $months = collect($res->json('data.orders_by_month'));
        $this->assertSame(3, (int) $months->sum('count'));
        $this->assertEqualsWithDelta(160.0, (float) $months->sum('total'), 0.01);
    }
}
