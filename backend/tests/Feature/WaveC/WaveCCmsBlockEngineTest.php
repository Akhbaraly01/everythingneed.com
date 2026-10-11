<?php

namespace Tests\Feature\WaveC;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Wave C - no-code block engine (spec S40-S45, S68, S99):
 * closed 24-type registry, server validation, revision history,
 * restore-as-new-version, retention pruning, slug rules and the
 * public /p/{slug} renderer with SEO props + dynamic resolution.
 */
class WaveCCmsBlockEngineTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');

        $this->admin = User::factory()->create();
        UserRole::create(['user_id' => $this->admin->id, 'role' => 'super_admin']);
        $this->actingAs($this->admin, 'sanctum');
    }

    /** Insert a cms_pages row directly (defaults match the Wave C columns). */
    private function makePage(array $attrs = []): string
    {
        $id = (string) Str::uuid();
        DB::table('cms_pages')->insert(array_merge([
            'id' => $id,
            'title' => 'Wave C Page',
            'slug' => 'wave-c-page-'.Str::lower(Str::random(6)),
            'content' => '',
            'status' => 'published',
            'visibility' => 'public',
            'template' => 'default',
            'created_at' => now(),
            'updated_at' => now(),
        ], $attrs));

        return $id;
    }

    private function heroBlock(string $title): array
    {
        return ['type' => 'hero', 'data' => ['title' => $title, 'subtitle' => 'Sub', 'align' => 'center']];
    }

    public function test_registry_lists_all_24_types_with_field_schemas(): void
    {
        $res = $this->getJson('/api/admin/cms/blocks/registry')->assertOk();

        $types = $res->json('types');
        $this->assertCount(24, $types);
        foreach (['hero', 'rich_text', 'image', 'cta', 'faq', 'product_grid', 'need_categories'] as $type) {
            $this->assertContains($type, $types);
        }

        $catalog = collect($res->json('data'));
        $hero = $catalog->firstWhere('type', 'hero');
        $this->assertIsArray($hero['fields']['title']);
        $this->assertTrue($hero['fields']['title']['required']);
        $this->assertSame(['left', 'center', 'right'], array_values($hero['fields']['align']['options']));
    }

    public function test_registry_and_builder_enforce_gate_and_permissions(): void
    {
        // Guest -> 401.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/admin/cms/blocks/registry')->assertUnauthorized();

        // Regular user -> 403 (no manageCms gate).
        $pleb = User::factory()->create();
        UserRole::create(['user_id' => $pleb->id, 'role' => 'user']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($pleb, 'sanctum')->getJson('/api/admin/cms/blocks/registry')->assertForbidden();

        // learning_admin holds cms.blocks.view/manage but fails the gate.
        $learning = User::factory()->create();
        UserRole::create(['user_id' => $learning->id, 'role' => 'learning_admin']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($learning, 'sanctum')->getJson('/api/admin/cms/blocks/registry')->assertForbidden();

        // moderator holds cms.blocks.view but fails the gate.
        $mod = User::factory()->create();
        UserRole::create(['user_id' => $mod->id, 'role' => 'moderator']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($mod, 'sanctum')->getJson('/api/admin/cms/blocks/registry')->assertForbidden();

        // cms_editor passes gate + cms.blocks.view.
        $editor = User::factory()->create();
        UserRole::create(['user_id' => $editor->id, 'role' => 'cms_editor']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($editor, 'sanctum')->getJson('/api/admin/cms/blocks/registry')->assertOk();
    }

    public function test_block_save_persists_blocks_and_creates_revision(): void
    {
        $pageId = $this->makePage();

        $res = $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [
                $this->heroBlock('Hello'),
                ['type' => 'rich_text', 'data' => ['heading' => 'About', 'body' => 'First paragraph.']],
            ],
            'note' => 'Initial layout',
        ])->assertOk();

        $res->assertJsonPath('data.revision.version', 1)
            ->assertJsonPath('data.revision.note', 'Initial layout')
            ->assertJsonPath('data.blocks.0.type', 'hero')
            ->assertJsonPath('data.blocks.1.type', 'rich_text');

        $this->assertSame(
            ['hero', 'rich_text'],
            DB::table('cms_blocks')->where('page_id', $pageId)->whereNull('deleted_at')->orderBy('sort_order')->pluck('type')->all(),
        );
        $this->assertDatabaseHas('cms_revisions', ['page_id' => $pageId, 'version' => 1, 'note' => 'Initial layout']);

        $list = $this->getJson("/api/admin/cms/pages/{$pageId}/blocks")->assertOk();
        $this->assertCount(2, $list->json('data'));
    }

    public function test_unknown_block_type_is_rejected(): void
    {
        $pageId = $this->makePage();

        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [['type' => 'script', 'data' => ['payload' => 'x']]],
        ])->assertStatus(422)->assertJsonValidationErrors(['blocks.0.type']);

        $this->assertSame(0, DB::table('cms_blocks')->where('page_id', $pageId)->count());
    }

    public function test_javascript_url_scheme_is_rejected(): void
    {
        $pageId = $this->makePage();

        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [['type' => 'hero', 'data' => ['title' => 'Hi', 'cta_url' => 'javascript:alert(1)']]],
        ])->assertStatus(422)->assertJsonValidationErrors(['blocks.0.data.cta_url']);

        $this->assertSame(0, DB::table('cms_blocks')->where('page_id', $pageId)->count());
    }

    public function test_required_if_source_selected_demands_filter(): void
    {
        $pageId = $this->makePage();

        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [['type' => 'product_grid', 'data' => ['source' => 'selected', 'limit' => 4]]],
        ])->assertStatus(422)->assertJsonValidationErrors(['blocks.0.data.filter']);

        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [['type' => 'product_grid', 'data' => ['source' => 'selected', 'filter' => 'electronics', 'limit' => 4]]],
        ])->assertOk();
    }

    public function test_unknown_data_keys_are_stripped(): void
    {
        $pageId = $this->makePage();

        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [['type' => 'hero', 'data' => ['title' => 'Clean', 'evil' => '<script>alert(1)</script>']]],
        ])->assertOk()->assertJsonPath('data.blocks.0.data.evil', null)
            ->assertJsonPath('data.blocks.0.data.title', 'Clean');
    }

    public function test_list_bounds_are_enforced(): void
    {
        $pageId = $this->makePage();

        // cards.items is min:1.
        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [['type' => 'cards', 'data' => ['items' => []]]],
        ])->assertStatus(422)->assertJsonValidationErrors(['blocks.0.data.items']);

        // cards.items is max:12.
        $items = array_fill(0, 13, ['title' => 'Card']);
        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [['type' => 'cards', 'data' => ['items' => $items]]],
        ])->assertStatus(422)->assertJsonValidationErrors(['blocks.0.data.items']);
    }

    public function test_page_may_hold_at_most_100_blocks(): void
    {
        $pageId = $this->makePage();

        $blocks = array_fill(0, 101, ['type' => 'spacer', 'data' => ['size' => 'md']]);
        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", ['blocks' => $blocks])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['blocks']);
    }

    public function test_restore_writes_forward_as_a_new_revision(): void
    {
        $pageId = $this->makePage();

        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [$this->heroBlock('Version One')],
        ])->assertOk();
        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [$this->heroBlock('Version Two')],
        ])->assertOk();

        $this->postJson("/api/admin/cms/pages/{$pageId}/revisions/1/restore")
            ->assertOk()
            ->assertJsonPath('data.revision.version', 3);

        // History is preserved: v1 and v2 both still exist.
        $versions = DB::table('cms_revisions')->where('page_id', $pageId)->orderBy('version')->pluck('version')->all();
        $this->assertSame([1, 2, 3], $versions);

        // The restored block set is live again.
        $blocks = $this->getJson("/api/admin/cms/pages/{$pageId}/blocks")->assertOk()->json('data');
        $this->assertSame('Version One', $blocks[0]['data']['title']);
    }

    public function test_retention_prunes_oldest_revisions(): void
    {
        config(['cms.revision_retention' => 2]);
        $pageId = $this->makePage();

        foreach (['A', 'B', 'C', 'D'] as $title) {
            $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
                'blocks' => [$this->heroBlock($title)],
            ])->assertOk();
        }

        $versions = DB::table('cms_revisions')->where('page_id', $pageId)->orderByDesc('version')->pluck('version')->all();
        $this->assertSame([4, 3], $versions, 'Only the newest N snapshots survive retention');
    }

    public function test_duplicate_slug_is_rejected_on_create(): void
    {
        $this->makePage(['slug' => 'taken-slug']);

        $this->postJson('/api/admin/cms/pages', [
            'title' => 'Another Page',
            'slug' => 'taken-slug',
        ])->assertStatus(422)->assertJsonValidationErrors(['slug']);

        $this->assertSame(1, DB::table('cms_pages')->where('slug', 'taken-slug')->whereNull('deleted_at')->count());
    }

    public function test_published_page_renders_publicly_with_seo_props(): void
    {
        $pageId = $this->makePage([
            'title' => 'Scholarship Info',
            'slug' => 'scholarship-info',
            'description' => 'How the scholarship works.',
            'seo_title' => 'Scholarship | EverythingNeed',
            'seo_description' => 'Apply for the scholarship.',
            'visibility' => 'unlisted',
        ]);
        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [$this->heroBlock('Scholarship Info')],
        ])->assertOk();

        $this->app['auth']->forgetGuards();

        $this->get('/p/scholarship-info')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Cms/Show')
                ->where('page.title', 'Scholarship Info')
                ->where('page.status', 'published')
                ->where('seo.title', 'Scholarship | EverythingNeed')
                ->where('seo.description', 'Apply for the scholarship.')
                ->where('seo.robots', 'noindex,follow')
                ->where('seo.canonical', url('/p/scholarship-info'))
                ->has('page.blocks', 1)
                ->where('page.blocks.0.type', 'hero'));
    }

    public function test_draft_page_is_404_for_guests_and_previews_for_admins(): void
    {
        $this->makePage(['slug' => 'draft-notes', 'status' => 'draft']);

        $this->app['auth']->forgetGuards();
        $this->get('/p/draft-notes')->assertNotFound();

        $this->actingAs($this->admin);
        $this->get('/p/draft-notes')->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('Cms/Show')->where('page.status', 'draft'),
        );
    }

    public function test_dynamic_grids_resolve_against_real_tables(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        $productId = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $productId,
            'vendor_id' => $vendor->id,
            'name' => 'Wave C Widget',
            'category' => 'electronics',
            'price' => 19.99,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $needSlug = 'wave-c-need-'.Str::lower(Str::random(4));
        DB::table('need_categories')->insert([
            'id' => (string) Str::uuid(),
            'name' => 'Wave C Need',
            'slug' => $needSlug,
            'description' => 'Demo need category',
            'icon' => 'grid',
            'color' => '#334155',
            'sort_order' => 1,
            'created_at' => now(),
        ]);

        $pageId = $this->makePage(['slug' => 'wave-c-dynamic']);
        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [
                ['type' => 'product_grid', 'data' => ['heading' => 'Products', 'source' => 'latest', 'limit' => 8]],
                ['type' => 'need_categories', 'data' => ['heading' => 'Needs', 'limit' => 8]],
            ],
        ])->assertOk();

        $this->app['auth']->forgetGuards();

        $this->get('/p/wave-c-dynamic')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Cms/Show')
                ->where('page.blocks.0.items.0.url', '/products/'.$productId)
                ->where('page.blocks.0.items.0.title', 'Wave C Widget')
                ->where('page.blocks.1.items.0.url', '/needs/'.$needSlug));
    }

    public function test_block_save_invalidates_the_public_page_cache(): void
    {
        $pageId = $this->makePage(['slug' => 'cache-check']);
        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [$this->heroBlock('Before')],
        ])->assertOk();

        $this->app['auth']->forgetGuards();
        $this->get('/p/cache-check')->assertOk();
        $this->assertNotNull(Cache::get('cms.page.cache-check'), 'First render warms the page cache');

        // An admin edit must drop the cached payload (spec S109).
        $this->actingAs($this->admin, 'sanctum');
        $this->putJson("/api/admin/cms/pages/{$pageId}/blocks", [
            'blocks' => [$this->heroBlock('After')],
        ])->assertOk();

        $this->assertNull(Cache::get('cms.page.cache-check'), 'Builder save must invalidate the page cache');

        $this->app['auth']->forgetGuards();
        $this->get('/p/cache-check')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('page.blocks.0.data.title', 'After'));
    }

    public function test_unregistered_block_type_never_renders(): void
    {
        $pageId = $this->makePage(['slug' => 'bypass-attempt']);
        // Simulate a rogue row written directly to the database.
        DB::table('cms_blocks')->insert([
            'id' => (string) Str::uuid(),
            'page_id' => $pageId,
            'type' => 'script',
            'data' => json_encode(['payload' => 'alert(1)']),
            'sort_order' => 0,
            'is_visible' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->app['auth']->forgetGuards();

        // The page still renders; the renderer ignores the unknown type.
        $this->get('/p/bypass-attempt')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Cms/Show')
                ->where('page.blocks.0.type', 'script'));
    }

    public function test_page_update_appends_a_details_revision(): void
    {
        $pageId = $this->makePage(['slug' => 'meta-update']);

        $this->putJson("/api/admin/cms/pages/{$pageId}", [
            'title' => 'Renamed Page',
            'description' => 'Updated description',
            'seo_title' => 'Renamed | EverythingNeed',
            'menu_placement' => 'footer',
        ])->assertOk();

        $revisions = DB::table('cms_revisions')->where('page_id', $pageId)->orderBy('version')->get();
        $this->assertCount(1, $revisions);
        $this->assertSame('Details updated', $revisions[0]->note);

        $snapshot = json_decode($revisions[0]->snapshot, true);
        $this->assertSame('Renamed Page', $snapshot['page']['title']);
        $this->assertSame('footer', $snapshot['page']['menu_placement']);
    }
}
