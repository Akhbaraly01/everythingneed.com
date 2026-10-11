<?php

namespace Tests\Feature\WaveB;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Modules\Admin\Entities\CmsBlock;
use Modules\Admin\Entities\CmsPage;
use Modules\Admin\Entities\CmsRevision;
use Modules\Admin\Entities\DynamicModule;
use Modules\Admin\Entities\DynamicModuleEntry;
use Modules\Admin\Entities\MediaItem;
use Modules\Admin\Entities\Navigation;
use Modules\Admin\Entities\NavigationItem;
use Tests\TestCase;

class WaveBNoCodeSchemaAndRbacTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
    }

    public function test_no_code_tables_exist(): void
    {
        $tables = ['cms_blocks', 'cms_revisions', 'navigations', 'navigation_items', 'cms_forms', 'cms_form_submissions', 'media_library', 'dynamic_modules', 'dynamic_module_entries'];
        foreach ($tables as $table) {
            $this->assertTrue(Schema::hasTable($table), "Missing table: {$table}");
        }
    }

    public function test_no_code_entities_use_uuidv7(): void
    {
        $page = CmsPage::create(['title' => 'Test', 'slug' => 'test-'.Str::random(6), 'status' => 'draft']);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/', $page->id);

        $block = CmsBlock::create(['page_id' => $page->id, 'type' => 'hero', 'data' => ['title' => 'Hi']]);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/', $block->id);
    }

    public function test_navigation_tree_hierarchy(): void
    {
        $nav = Navigation::create(['name' => 'Header', 'location' => 'header', 'status' => 'published']);
        $parent = NavigationItem::create(['navigation_id' => $nav->id, 'title' => 'Products', 'url' => '/products', 'sort_order' => 1]);
        $child = NavigationItem::create(['navigation_id' => $nav->id, 'parent_id' => $parent->id, 'title' => 'Electronics', 'url' => '/products/electronics', 'sort_order' => 1]);

        $this->assertTrue($parent->children->contains($child));
        $this->assertEquals($parent->id, $child->parent->id);
    }

    public function test_media_library_records(): void
    {
        $media = MediaItem::create([
            'title' => 'Hero Banner',
            'file_name' => 'hero.jpg',
            'path' => 'media/hero.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 102400,
            'width' => 1920,
            'height' => 1080,
        ]);

        $this->assertDatabaseHas('media_library', ['id' => $media->id, 'mime_type' => 'image/jpeg']);
    }

    public function test_dynamic_module_and_entry(): void
    {
        $module = DynamicModule::create([
            'name' => 'Scholarships',
            'slug' => 'scholarships',
            'fields' => [['name' => 'title', 'type' => 'text', 'required' => true]],
            'status' => 'published',
        ]);

        $entry = DynamicModuleEntry::create([
            'module_id' => $module->id,
            'slug' => 'wave-b-test',
            'data' => ['title' => 'Wave B Scholarship'],
            'status' => 'published',
        ]);

        $this->assertTrue($module->entries->contains($entry));
        $this->assertEquals('Wave B Scholarship', $entry->data['title']);
    }

    public function test_permission_catalog_contains_spec_s64_aliases(): void
    {
        $aliases = ['users.view', 'users.manage', 'products.view', 'products.manage', 'products.publish', 'orders.view', 'orders.manage', 'healthcare.view', 'healthcare.manage', 'doctors.view', 'doctors.manage', 'learn.view', 'learn.manage', 'learn.publish', 'cms.view', 'cms.manage', 'cms.publish', 'wallet.view', 'wallet.manage', 'kyc.view', 'kyc.manage', 'payments.view', 'payments.manage', 'payments.refund', 'settings.view', 'settings.manage', 'rbac.view', 'rbac.manage', 'audit.view'];
        foreach ($aliases as $alias) {
            $this->assertContains($alias, PermissionSeeder::CATALOG, "Missing spec S64 alias: {$alias}");
        }
    }

    public function test_permission_catalog_contains_no_code_permissions(): void
    {
        $perms = ['cms.blocks.view', 'cms.blocks.manage', 'cms.blocks.publish', 'cms.revisions.view', 'cms.revisions.manage', 'cms.revisions.restore', 'navigation.view', 'navigation.manage', 'forms.view', 'forms.manage', 'forms.respond', 'media.view', 'media.manage', 'modules.view', 'modules.manage'];
        foreach ($perms as $perm) {
            $this->assertContains($perm, PermissionSeeder::CATALOG, "Missing no-code permission: {$perm}");
        }
    }

    public function test_two_segment_alias_resolves_to_three_segment_grants(): void
    {
        $user = User::factory()->create();
        DB::table('user_roles')->insert(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'role' => 'cms_editor', 'created_at' => now(), 'updated_at' => now()]);
        Cache::forget('rbac.matrix');

        // cms_editor holds cms.blocks.* via prefix grant; the 2-segment alias
        // "cms.blocks.view" is already 3-segment here, but "cms.manage" (2-seg)
        // must resolve to any cms.*.manage grant the role holds.
        $this->assertTrue($user->hasPermission('cms.blocks.view'));
        $this->assertTrue($user->hasPermission('cms.manage'));
        $this->assertFalse($user->hasPermission('users.view'));
    }

    public function test_existing_140_permissions_unchanged(): void
    {
        $original = [
            'products.products.view', 'products.products.create', 'products.products.update', 'products.products.delete', 'products.products.publish', 'products.products.approve',
            'orders.orders.view', 'orders.orders.create', 'orders.orders.update', 'orders.orders.manage', 'orders.orders.refund', 'orders.orders.cancel',
            'users.users.view', 'users.users.create', 'users.users.update', 'users.users.delete', 'users.users.suspend', 'users.users.activate',
            'users.permissions.manage',
            'vendors.vendors.view', 'vendors.vendors.approve', 'vendors.vendors.suspend', 'vendors.vendors.commission', 'vendors.vendors.manage',
            'healthcare.overview.view', 'healthcare.doctors.manage', 'healthcare.appointments.view', 'healthcare.appointments.create', 'healthcare.appointments.manage', 'healthcare.records.view', 'healthcare.prescriptions.manage', 'healthcare.labs.manage',
            'learn.overview.view', 'learn.courses.manage', 'learn.courses.create', 'learn.lessons.manage', 'learn.certificates.issue', 'learn.quizzes.manage',
            'hotels.overview.view', 'hotels.overview.manage', 'hotels.rooms.manage', 'hotels.reservations.view', 'hotels.reservations.manage',
            'food.overview.view', 'food.overview.manage', 'food.orders.view', 'food.orders.manage', 'food.menu.manage',
            'jobs.overview.view', 'jobs.jobs.create', 'jobs.overview.manage', 'jobs.applications.view', 'jobs.applications.manage',
            'job_seekers.overview.view', 'job_seekers.overview.manage', 'job_seekers.requests.manage',
            'real_estate.overview.view', 'real_estate.overview.manage', 'real_estate.inquiries.manage',
            'rides.overview.view', 'rides.overview.manage', 'rides.drivers.manage', 'rides.flights.manage',
            'transport.overview.view', 'transport.overview.manage', 'transport.requests.manage',
            'agriculture.overview.view', 'agriculture.overview.manage', 'agriculture.products.manage', 'agriculture.workers.manage',
            'building_services.overview.view', 'building_services.overview.manage', 'building_services.workers.manage', 'building_services.bookings.manage',
            'needs.overview.view', 'needs.requests.create', 'needs.overview.manage', 'needs.offers.manage', 'needs.requests.view',
            'tasks.overview.view', 'tasks.tasks.create', 'tasks.overview.manage', 'tasks.applications.manage', 'tasks.submissions.verify',
            'pharmacy.overview.view', 'pharmacy.overview.manage', 'pharmacy.medicines.manage', 'pharmacy.prescriptions.view', 'pharmacy.prescriptions.manage',
            'messaging.overview.view', 'messaging.conversations.manage',
            'notifications.overview.view', 'notifications.overview.manage',
            'reviews.reviews.view', 'reviews.reviews.create', 'reviews.reviews.moderate', 'reviews.reviews.delete',
            'delivery.deliveries.view', 'delivery.deliveries.manage', 'delivery.deliveries.track',
            'inventory.stock.view', 'inventory.stock.manage', 'inventory.movements.view',
            'categories.categories.view', 'categories.categories.manage',
            'deals.deals.view', 'deals.deals.manage',
            'subscriptions.subscriptions.view', 'subscriptions.subscriptions.manage',
            'payments.payments.view', 'payments.payments.manage',
            'analytics.overview.view', 'analytics.overview.export',
            'audit.logs.view', 'audit.logs.export',
            'support.overview.view', 'support.tickets.view', 'support.tickets.manage', 'support.tickets.create', 'support.tickets.assign', 'support.tickets.transfer', 'support.tickets.escalate', 'support.tickets.resolve',
            'cms.pages.view', 'cms.pages.manage', 'cms.pages.publish',
            'finance.overview.view', 'finance.payments.manage', 'finance.refunds.process', 'finance.payouts.manage', 'finance.transactions.view',
            'settings.overview.view', 'settings.system.update', 'settings.features.manage',
            'kyc.applications.view', 'kyc.applications.review',
            'departments.departments.view', 'departments.departments.manage',
            'reports.reports.view', 'reports.reports.export',
        ];
        foreach ($original as $perm) {
            $this->assertContains($perm, PermissionSeeder::CATALOG, "Original permission lost: {$perm}");
        }
        $this->assertCount(140, $original, 'The original 140-permission set must be intact');
    }
}
