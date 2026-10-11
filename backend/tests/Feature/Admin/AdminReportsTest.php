<?php

namespace Tests\Feature\Admin;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * W5.4 — /admin/reports console: reports.reports.view to read,
 * reports.reports.export for the CSV (analyst is view-only, auditor can
 * export), windowed sales/analytics report data, and the web role gate.
 */
class AdminReportsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function insertVendorOrder(float $total, \DateTimeInterface $when): void
    {
        $owner = $this->createUser();
        $vendor = $this->createVendor($owner);

        DB::table('vendor_orders')->insert([
            'id'           => (string) Str::uuid(),
            'vendor_id'    => $vendor->id,
            'customer_id'  => $owner->id,
            'product_name' => 'Report Fixture',
            'quantity'     => 1,
            'unit_price'   => $total,
            'total_price'  => $total,
            'order_number' => 'RO-'.Str::random(12),
            'status'       => 'delivered',
            'created_at'   => $when,
            'updated_at'   => $when,
        ]);
    }

    private function insertEvent(string $userId, string $type, \DateTimeInterface $when): void
    {
        DB::table('analytics_events')->insert([
            'id'         => (string) Str::uuid(),
            'user_id'    => $userId,
            'event_type' => $type,
            'created_at' => $when,
        ]);
    }

    public function test_view_gate_allows_report_roles_and_denies_others(): void
    {
        $this->getJson('/api/admin/reports/sales')->assertUnauthorized();

        $denied = $this->createUser();
        $this->assignRole($denied, 'content_manager');
        $this->actingAs($denied, 'sanctum');
        $this->getJson('/api/admin/reports/sales')->assertForbidden();
        $this->getJson('/api/admin/reports/analytics')->assertForbidden();

        $analyst = $this->createUser();
        $this->assignRole($analyst, 'analyst');
        $this->actingAs($analyst, 'sanctum');
        $this->getJson('/api/admin/reports/sales')->assertOk();
        $this->getJson('/api/admin/reports/analytics')->assertOk();

        $auditor = $this->createUser();
        $this->assignRole($auditor, 'auditor');
        $this->actingAs($auditor, 'sanctum');
        $this->getJson('/api/admin/reports/sales')->assertOk();
    }

    public function test_sales_report_scopes_to_requested_window(): void
    {
        $this->insertVendorOrder(100, now()->subDays(2));
        $this->insertVendorOrder(200, now()->subDays(40));

        $viewer = $this->createUser();
        $this->assignRole($viewer, 'analytics_admin');
        $this->actingAs($viewer, 'sanctum');

        $week = $this->getJson('/api/admin/reports/sales?start_date='.now()->subDays(7)->toDateString()
            .'&end_date='.now()->toDateString())->assertOk();
        $this->assertSame(1, $week->json('data.total_orders'));
        $this->assertEqualsWithDelta(100.0, (float) $week->json('data.total_revenue'), 0.01);
        $this->assertEqualsWithDelta(100.0, (float) $week->json('data.avg_order_value'), 0.01);

        $quarter = $this->getJson('/api/admin/reports/sales?start_date='.now()->subDays(90)->toDateString()
            .'&end_date='.now()->toDateString())->assertOk();
        $this->assertSame(2, $quarter->json('data.total_orders'));
        $this->assertEqualsWithDelta(300.0, (float) $quarter->json('data.total_revenue'), 0.01);

        // Default window (no params) is the last 30 days: the 40d-old row stays out.
        $default = $this->getJson('/api/admin/reports/sales')->assertOk();
        $this->assertSame(1, $default->json('data.total_orders'));
    }

    public function test_analytics_report_scopes_to_window(): void
    {
        $a = $this->createUser();
        $b = $this->createUser();
        $this->insertEvent($a->id, 'page_view', now()->subDays(1));
        $this->insertEvent($a->id, 'page_view', now()->subDays(2));
        $this->insertEvent($b->id, 'checkout', now()->subDays(2));
        $this->insertEvent($a->id, 'page_view', now()->subDays(40));

        $viewer = $this->createUser();
        $this->assignRole($viewer, 'analytics_admin');
        $this->actingAs($viewer, 'sanctum');

        $week = $this->getJson('/api/admin/reports/analytics?start_date='.now()->subDays(7)->toDateString()
            .'&end_date='.now()->toDateString())->assertOk();
        $this->assertSame(3, $week->json('data.total_events'));
        $this->assertSame(2, $week->json('data.unique_users'));
        $this->assertSame(2, (int) ($week->json('data.event_breakdown.page_view') ?? 0));
        $this->assertSame(1, (int) ($week->json('data.event_breakdown.checkout') ?? 0));

        $quarter = $this->getJson('/api/admin/reports/analytics?start_date='.now()->subDays(90)->toDateString()
            .'&end_date='.now()->toDateString())->assertOk();
        $this->assertSame(4, $quarter->json('data.total_events'));
    }

    public function test_inverted_range_is_rejected(): void
    {
        $viewer = $this->createUser();
        $this->assignRole($viewer, 'analytics_admin');
        $this->actingAs($viewer, 'sanctum');

        $this->getJson('/api/admin/reports/sales?start_date=2026-10-01&end_date=2026-09-01')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['start_date']);
    }

    public function test_export_gates_and_csv_content(): void
    {
        $this->getJson('/api/admin/reports/export')->assertUnauthorized();

        // analyst: view yes, export no.
        $analyst = $this->createUser();
        $this->assignRole($analyst, 'analyst');
        $this->actingAs($analyst, 'sanctum');
        $this->getJson('/api/admin/reports/export')->assertForbidden();

        // auditor: reports.* — can export.
        $auditor = $this->createUser();
        $this->assignRole($auditor, 'auditor');
        $this->actingAs($auditor, 'sanctum');

        $res = $this->get('/api/admin/reports/export?start_date='.now()->subDays(7)->toDateString()
            .'&end_date='.now()->toDateString());
        $res->assertOk();
        $this->assertStringContainsString('text/csv', (string) $res->headers->get('Content-Type'));
        $this->assertStringContainsString(
            'everythingneed-sales-report-',
            (string) $res->headers->get('Content-Disposition'),
        );

        $csv = $res->streamedContent();
        $this->assertStringContainsString('EverythingNeed sales report', $csv);
        $this->assertStringContainsString('total_revenue', $csv);
        $this->assertStringContainsString('date,revenue,orders', $csv);
    }

    public function test_web_reports_page_follows_role_gate(): void
    {
        // Guest is bounced to login.
        $this->get('/admin/reports')->assertRedirect();

        $analyst = $this->createUser();
        $this->assignRole($analyst, 'analyst');
        $this->actingAs($analyst, 'web');
        $this->get('/admin/reports')->assertOk();

        // content_manager is refused with the standard workspace error flash.
        $denied = $this->createUser();
        $this->assignRole($denied, 'content_manager');
        $landing = app(\Core\Services\Contracts\WorkspaceResolverInterface::class)->landingPath($denied);
        $this->actingAs($denied, 'web')
            ->get('/admin/reports')
            ->assertRedirect($landing)
            ->assertSessionHas('error');
    }
}
