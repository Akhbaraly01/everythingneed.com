<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\HomePageSectionsSeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeSectionManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $content;
    private User $admin;
    private User $super;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');

        $this->content = User::factory()->create();
        UserRole::create(['user_id' => $this->content->id, 'role' => 'content_manager']);

        $this->admin = User::factory()->create();
        UserRole::create(['user_id' => $this->admin->id, 'role' => 'administrator']);

        $this->super = User::factory()->create();
        UserRole::create(['user_id' => $this->super->id, 'role' => 'super_admin']);
    }

    public function test_guest_gets_401_on_sections_index(): void
    {
        $this->getJson('/api/admin/home-sections')->assertUnauthorized();
    }

    public function test_content_manager_can_list_but_cannot_create_or_delete(): void
    {
        $this->actingAs($this->content, 'sanctum');

        $this->getJson('/api/admin/home-sections')->assertOk()->assertJsonPath('data', []);

        $this->postJson('/api/admin/home-sections', [
            'name' => 'Nope',
            'slug' => 'nope',
        ])->assertForbidden();
    }

    public function test_administrator_can_toggle_and_reorder_but_cannot_create_or_delete(): void
    {
        $this->seed(HomePageSectionsSeeder::class);
        $this->actingAs($this->admin, 'sanctum');

        $list = $this->getJson('/api/admin/home-sections')->assertOk();
        $this->assertCount(14, $list->json('data'));
        $first = $list->json('data.0');

        // Toggle off.
        $this->putJson("/api/admin/home-sections/{$first['id']}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        // Reorder (reverse).
        $ids = collect($list->json('data'))->pluck('id')->reverse()->values()->all();
        $reordered = $this->putJson('/api/admin/home-sections/reorder', ['order' => $ids])->assertOk();
        $this->assertSame($ids[0], $reordered->json('data.0.id'));

        // Create + delete stay Super Admin-only.
        $this->postJson('/api/admin/home-sections', ['name' => 'X', 'slug' => 'x'])->assertForbidden();
        $this->deleteJson("/api/admin/home-sections/{$first['id']}")->assertForbidden();
    }

    public function test_super_admin_has_full_control(): void
    {
        $this->actingAs($this->super, 'sanctum');

        $create = $this->postJson('/api/admin/home-sections', [
            'name' => 'Event Planning',
            'slug' => 'event-planning',
        ])->assertStatus(201);
        $id = $create->json('data.id');
        $this->assertNotEmpty($id);
        $this->assertDatabaseHas('home_page_sections', ['id' => $id, 'slug' => 'event-planning']);

        $this->putJson("/api/admin/home-sections/{$id}", ['name' => 'Events'])->assertOk()
            ->assertJsonPath('data.name', 'Events');

        $this->deleteJson("/api/admin/home-sections/{$id}")->assertOk();
        $this->assertNotNull(DB::table('home_page_sections')->where('id', $id)->value('deleted_at'));
    }

    public function test_validation_rejects_bad_and_duplicate_slugs(): void
    {
        $this->actingAs($this->super, 'sanctum');

        $this->postJson('/api/admin/home-sections', ['name' => 'Bad', 'slug' => 'Bad Slug!'])
            ->assertStatus(422);

        $this->postJson('/api/admin/home-sections', ['name' => 'A', 'slug' => 'dup'])->assertStatus(201);
        $this->postJson('/api/admin/home-sections', ['name' => 'B', 'slug' => 'dup'])->assertStatus(422);

        $this->putJson('/api/admin/home-sections/missing', ['is_active' => true])->assertNotFound();
        $this->putJson('/api/admin/home-sections/reorder', ['order' => 'nope'])->assertStatus(422);
    }

    public function test_seeder_is_idempotent_and_seeds_batch_setting(): void
    {
        $this->seed(HomePageSectionsSeeder::class);
        $this->seed(HomePageSectionsSeeder::class);

        $this->assertSame(14, DB::table('home_page_sections')->whereNull('deleted_at')->count());
        $this->assertSame(
            ['featured', 'deals', 'services'],
            DB::table('home_page_sections')->orderBy('order')->limit(3)->pluck('slug')->all()
        );
        $this->assertSame(
            '12',
            DB::table('system_settings')->where('key', 'home.products_per_batch')->value('value')
        );
    }

    public function test_home_props_carry_sections_batch_and_builder_list(): void
    {
        $this->seed(HomePageSectionsSeeder::class);

        $vendor = \Modules\Vendors\Entities\Vendor::factory()->create();
        \Modules\Products\Entities\Product::factory()->count(3)->create(['vendor_id' => $vendor->id]);

        $this->get('/')->assertOk()->assertInertia(function (Assert $page) {
            $page->component('Home/Index')
                ->has('homeSections', 14)
                ->where('productsPerBatch', 12)
                ->has('products.data', 3)
                ->has('sections.featured')
                ->where('seo.robots', 'index,follow')
                ->where('seo.canonical', url('/'));
        });
    }

    public function test_home_seo_metadata_is_honest(): void
    {
        $this->get('/')->assertOk()->assertInertia(function (Assert $page) {
            $page->component('Home/Index')
                ->whereType('seo.title', 'string')
                ->whereType('seo.description', 'string')
                ->where('seo.canonical', url('/'));
        });

        $html = $this->get('/')->assertOk()->getContent();
        $this->assertStringNotContainsString('satisfied customers', $html);
        $this->assertStringNotContainsString('5-star rated platform', $html);
    }

    public function test_admin_console_renders_for_content_roles_and_redirects_guests(): void
    {
        $this->get('/admin/home-sections')->assertRedirect('/login');

        $this->actingAs($this->content, 'web')
            ->get('/admin/home-sections')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/HomeSections'));

        $this->actingAs($this->admin, 'web')
            ->get('/admin/home-sections')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/HomeSections'));
    }
}
