<?php

namespace Tests\Feature\WaveR;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Wave R — spec §109 (indexes, caching, N+1) + §111 (scheduler maintenance).
 */
class WaveRPerformanceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    public function test_hot_path_indexes_exist(): void
    {
        $this->assertTrue(Schema::hasIndex('audit_logs', 'audit_logs_created_at_index'));
        $this->assertTrue(Schema::hasIndex('payments', 'payments_status_created_at_index'));
        $this->assertTrue(Schema::hasIndex('users', 'users_created_at_index'));
        $this->assertTrue(Schema::hasIndex('vendor_orders', 'vendor_orders_created_at_index'));
        $this->assertTrue(Schema::hasIndex('notifications', 'notifications_user_id_is_read_index'));
    }

    public function test_overview_is_cached_per_range(): void
    {
        $viewer = $this->createUser();
        $this->assignRole($viewer, 'analytics_admin');
        $this->actingAs($viewer, 'sanctum');

        $first = $this->getJson('/api/admin/analytics/overview?range=7d')->assertOk();
        $this->assertTrue(Cache::has('analytics.overview.7d'));

        $second = $this->getJson('/api/admin/analytics/overview?range=7d')->assertOk();
        $this->assertSame($first->json('data'), $second->json('data'));

        $this->getJson('/api/admin/analytics/overview?range=90d')->assertOk();
        $this->assertTrue(Cache::has('analytics.overview.90d'));
    }

    public function test_cms_prune_revisions_keeps_the_retention_window(): void
    {
        config(['cms.revision_retention' => 5]);

        $this->actingAsUser('content_admin');
        $pageId = $this->postJson('/api/admin/cms/pages', ['title' => 'Prune me'])
            ->assertStatus(201)
            ->json('data.id');

        for ($v = 2; $v <= 8; $v++) {
            DB::table('cms_revisions')->insert([
                'id' => (string) Str::uuid(),
                'page_id' => $pageId,
                'version' => $v,
                'snapshot' => json_encode(['v' => $v]),
                'created_at' => now(),
            ]);
        }
        $this->assertSame(8, DB::table('cms_revisions')->where('page_id', $pageId)->count());

        $this->artisan('cms:prune-revisions')->assertSuccessful();

        $rows = DB::table('cms_revisions')->where('page_id', $pageId)->orderBy('version')->get();
        $this->assertCount(5, $rows);
        $this->assertSame(4, (int) $rows->first()->version);
    }

    public function test_needs_expire_past_deadline_only_when_published(): void
    {
        $userId = $this->createUser()->id;
        $make = function (string $status, ?string $deadline) use ($userId): string {
            $id = (string) Str::uuid();
            DB::table('need_requests')->insert([
                'id' => $id,
                'user_id' => $userId,
                'request_number' => 'WQ-' . Str::random(8),
                'title' => 'WaveQ need',
                'description' => 'x',
                'status' => $status,
                'currency' => 'USD',
                'deadline' => $deadline,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $id;
        };

        $past = now()->subDay()->toDateString();
        $future = now()->addDay()->toDateString();

        $expired = $make('published', $past);
        $draft = $make('draft', $past);
        $open = $make('published', $future);
        $noDeadline = $make('published', null);

        $this->artisan('needs:expire-past-deadline')->assertSuccessful();

        $status = fn (string $id) => DB::table('need_requests')->where('id', $id)->value('status');
        $this->assertSame('expired', $status($expired));
        $this->assertSame('draft', $status($draft));
        $this->assertSame('published', $status($open));
        $this->assertSame('published', $status($noDeadline));
    }

    public function test_notifications_prune_read_keeps_unread_and_recent(): void
    {
        $userId = $this->createUser()->id;
        $make = function (bool $read, int $daysAgo) use ($userId): string {
            $id = (string) Str::uuid();
            DB::table('notifications')->insert([
                'id' => $id,
                'user_id' => $userId,
                'title' => 'WaveQ note',
                'message' => 'x',
                'type' => 'general',
                'is_read' => $read,
                'created_at' => now()->subDays($daysAgo),
            ]);

            return $id;
        };

        $oldRead = $make(true, 100);
        $recentRead = $make(true, 5);
        $oldUnread = $make(false, 100);

        $this->artisan('notifications:prune-read', ['--days' => 90])->assertSuccessful();

        $exists = fn (string $id) => DB::table('notifications')->where('id', $id)->exists();
        $this->assertFalse($exists($oldRead));
        $this->assertTrue($exists($recentRead));
        $this->assertTrue($exists($oldUnread));
    }

    public function test_domain_event_listeners_are_queued(): void
    {
        foreach ([
            \Modules\Orders\Listeners\SendOrderConfirmation::class,
            \Modules\Orders\Listeners\ProcessOrderCancellation::class,
            \Modules\Payments\Listeners\UpdateOrderStatus::class,
            \Modules\Payments\Listeners\ProcessRefundNotification::class,
            \Modules\Healthcare\Listeners\NotifyDoctorOfAppointment::class,
            \Modules\Healthcare\Listeners\NotifyPatientOfDoctorAssignment::class,
            \Modules\Messaging\Listeners\NotifyDepartmentOfTicket::class,
            \Modules\Messaging\Listeners\NotifyUserOfReply::class,
            \Modules\Products\Listeners\NotifyVendorLowStock::class,
        ] as $listener) {
            $this->assertTrue(
                is_a($listener, \Illuminate\Contracts\Queue\ShouldQueue::class, true),
                "{$listener} must implement ShouldQueue (spec §110)."
            );
        }
    }

    public function test_product_listing_avoids_n_plus_one(): void
    {
        $vendorA = (string) Str::uuid();
        $vendorB = (string) Str::uuid();
        foreach ([$vendorA, $vendorA, $vendorB] as $i => $vendorId) {
            DB::table('products')->insert([
                'id' => (string) Str::uuid(),
                'vendor_id' => $vendorId,
                'name' => "WaveQ Product {$i}",
                'description' => 'x',
                'category' => 'misc',
                'price' => 10,
                'stock_quantity' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        DB::table('vendors')->insert([
            ['id' => $vendorA, 'user_id' => (string) Str::uuid(), 'store_name' => 'A', 'category' => 'misc', 'created_at' => now(), 'updated_at' => now()],
            ['id' => $vendorB, 'user_id' => (string) Str::uuid(), 'store_name' => 'B', 'category' => 'misc', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $queries = 0;
        DB::listen(function () use (&$queries): void {
            $queries++;
        });

        $this->getJson('/api/products?per_page=15')->assertOk();

        // paginate (count + page) + one eager vendor load — anything more is N+1.
        $this->assertLessThanOrEqual(6, $queries, "Product listing fired {$queries} queries.");
    }
}
