<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CmsManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $content;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');

        $this->content = User::factory()->create();
        UserRole::create(['user_id' => $this->content->id, 'role' => 'content_manager']);
        $this->actingAs($this->content, 'sanctum');
    }

    public function test_content_manager_can_create_page_with_uuid_and_publish(): void
    {
        $create = $this->postJson('/api/admin/cms/pages', [
            'title' => 'About EverythingNeed',
            'content' => '<p>We help people get things done.</p>',
            'status' => 'published',
        ]);

        $create->assertStatus(201)
            ->assertJsonPath('data.status', 'published');

        $id = $create->json('data.id');
        $this->assertNotEmpty($id);
        $this->assertNotSame('0', (string) $id);

        $this->assertDatabaseHas('cms_pages', [
            'id' => $id,
            'slug' => 'about-everythingneed',
            'status' => 'published',
        ]);
    }

    public function test_update_page_changes_title_content_status(): void
    {
        $id = (string) \Illuminate\Support\Str::uuid();
        DB::table('cms_pages')->insert([
            'id' => $id,
            'title' => 'Old Title',
            'slug' => 'old-title',
            'content' => 'old',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->putJson("/api/admin/cms/pages/{$id}", [
            'title' => 'New Title',
            'content' => 'new body',
            'status' => 'published',
        ])->assertOk()
            ->assertJsonPath('data.title', 'New Title')
            ->assertJsonPath('data.slug', 'new-title')
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.content', 'new body');
    }

    public function test_duplicate_title_gets_unique_slug(): void
    {
        $this->postJson('/api/admin/cms/pages', ['title' => 'Contact'])->assertStatus(201);
        $second = $this->postJson('/api/admin/cms/pages', ['title' => 'Contact'])->assertStatus(201);

        $this->assertSame('contact-2', $second->json('data.slug'));
    }

    public function test_banner_create_accepts_media_fields_and_public_list_filters(): void
    {
        $this->postJson('/api/admin/cms/banners', [
            'title' => 'Summer Sale',
            'position' => 'homepage',
            'image_url' => 'https://cdn.example.com/sale.jpg',
            'link_url' => '/products',
            'sort_order' => 5,
            'is_active' => true,
        ])->assertStatus(201)
            ->assertJsonPath('data.image_url', 'https://cdn.example.com/sale.jpg')
            ->assertJsonPath('data.sort_order', 5);

        $this->postJson('/api/admin/cms/banners', [
            'title' => 'Hidden Banner',
            'is_active' => false,
        ])->assertStatus(201);

        $public = $this->getJson('/api/cms/banners/public');
        $public->assertOk();

        $titles = collect($public->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Summer Sale'));
        $this->assertFalse($titles->contains('Hidden Banner'));
    }

    public function test_update_banner_toggles_active_and_soft_delete_hides_from_public(): void
    {
        $create = $this->postJson('/api/admin/cms/banners', [
            'title' => 'Temp',
            'is_active' => true,
        ])->assertStatus(201);
        $id = $create->json('data.id');

        $this->putJson("/api/admin/cms/banners/{$id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertJsonMissingPathValue(
            collect($this->getJson('/api/cms/banners/public')->json('data'))->pluck('title')->all(),
            'Temp',
        );

        $this->deleteJson("/api/admin/cms/banners/{$id}")->assertOk();

        // Soft delete: row remains with deleted_at set.
        $this->assertNotNull(DB::table('cms_banners')->where('id', $id)->value('deleted_at'));
        $publicAfter = collect($this->getJson('/api/cms/banners/public')->json('data'))->pluck('title')->all();
        $this->assertFalse(in_array('Temp', $publicAfter, true));
    }

    public function test_public_pages_only_return_published(): void
    {
        DB::table('cms_pages')->insert([
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'title' => 'Live',
                'slug' => 'live',
                'content' => 'yes',
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'title' => 'Draft',
                'slug' => 'draft-page',
                'content' => 'no',
                'status' => 'draft',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $list = $this->getJson('/api/cms/pages/public')->assertOk();
        $slugs = collect($list->json('data'))->pluck('slug');
        $this->assertTrue($slugs->contains('live'));
        $this->assertFalse($slugs->contains('draft-page'));

        $this->getJson('/api/cms/pages/public/live')->assertOk()
            ->assertJsonPath('data.title', 'Live');

        $this->getJson('/api/cms/pages/public/draft-page')->assertStatus(404);
    }

    public function test_blog_publish_sets_published_at_and_public_list_works(): void
    {
        $create = $this->postJson('/api/admin/cms/blog', [
            'title' => 'Launch Post',
            'content' => 'Hello world',
            'status' => 'published',
        ])->assertStatus(201);

        $this->assertNotNull($create->json('data.published_at'));

        $public = $this->getJson('/api/cms/blog/public')->assertOk();
        $this->assertTrue(
            collect($public->json('data'))->pluck('title')->contains('Launch Post')
        );
    }

    public function test_announcement_date_window_and_public_filter(): void
    {
        DB::table('cms_announcements')->insert([
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'title' => 'Active Now',
                'content' => 'ok',
                'priority' => 'high',
                'is_active' => true,
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'title' => 'Expired Promo',
                'content' => 'old',
                'priority' => 'medium',
                'is_active' => true,
                'starts_at' => now()->subMonth(),
                'ends_at' => now()->subWeek(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'title' => 'Inactive',
                'content' => 'off',
                'priority' => 'low',
                'is_active' => false,
                'starts_at' => null,
                'ends_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $public = $this->getJson('/api/cms/announcements/public')->assertOk();
        $titles = collect($public->json('data'))->pluck('title');

        $this->assertTrue($titles->contains('Active Now'));
        $this->assertFalse($titles->contains('Expired Promo'));
        $this->assertFalse($titles->contains('Inactive'));
        $this->assertSame('Active Now', $titles->first(), 'high priority should sort first');
    }

    public function test_cms_routes_require_manage_cms_gate(): void
    {
        $this->app['auth']->forgetGuards();

        $pleb = User::factory()->create();
        UserRole::create(['user_id' => $pleb->id, 'role' => 'user']);

        $this->actingAs($pleb, 'sanctum')
            ->postJson('/api/admin/cms/pages', ['title' => 'Nope'])
            ->assertStatus(403);

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/admin/cms/pages', ['title' => 'Nope'])->assertStatus(401);
    }

    public function test_delete_page_is_soft_and_hidden_from_admin_list(): void
    {
        $create = $this->postJson('/api/admin/cms/pages', ['title' => 'Gone Soon'])->assertStatus(201);
        $id = $create->json('data.id');

        $this->deleteJson("/api/admin/cms/pages/{$id}")->assertOk();

        $adminList = collect($this->getJson('/api/admin/cms/pages')->json('data'))->pluck('id');
        $this->assertFalse($adminList->contains($id));
        $this->assertNotNull(DB::table('cms_pages')->where('id', $id)->value('deleted_at'));
    }

    public function test_banner_can_reference_an_uploaded_image(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        // CMS media upload: file picker posts to /api/upload and reuses its URL.
        $upload = $this->post('/api/upload', [
            'file' => \Illuminate\Http\UploadedFile::fake()->image('banner.jpg'),
        ]);
        $upload->assertStatus(201);
        $url = $upload->json('data.url');
        $this->assertNotEmpty($url);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($upload->json('data.path'));

        $this->postJson('/api/admin/cms/banners', [
            'title' => 'Uploaded Banner',
            'position' => 'homepage',
            'image_url' => $url,
            'is_active' => true,
        ])->assertStatus(201)
            ->assertJsonPath('data.image_url', $url);

        $publicImages = collect($this->getJson('/api/cms/banners/public')->json('data'))
            ->pluck('image_url')
            ->all();
        $this->assertContains($url, $publicImages, 'uploaded banner URL must be publicly served');
    }

    public function test_cms_editor_non_super_can_create_and_edit_content(): void
    {
        // The edit path (PUT) used to be reachable only from tests — a
        // least-privilege cms_editor must get the full create → edit cycle.
        $editor = User::factory()->create();
        UserRole::create(['user_id' => $editor->id, 'role' => 'cms_editor']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($editor, 'sanctum');

        $id = $this->postJson('/api/admin/cms/blog', [
            'title' => 'Editor Draft',
            'content' => 'first',
            'status' => 'draft',
        ])->assertStatus(201)->json('data.id');

        $this->putJson("/api/admin/cms/blog/{$id}", [
            'title' => 'Editor Draft v2',
            'content' => 'second',
            'status' => 'published',
        ])->assertOk()
            ->assertJsonPath('data.content', 'second')
            ->assertJsonPath('data.status', 'published');

        $this->assertDatabaseHas('cms_blog_posts', [
            'id' => $id,
            'title' => 'Editor Draft v2',
            'slug' => 'editor-draft-v2',
            'status' => 'published',
        ]);
    }

    public function test_banner_edit_updates_position_active_state_and_sort(): void
    {
        $create = $this->postJson('/api/admin/cms/banners', [
            'title' => 'Placement Banner',
            'position' => 'homepage',
            'is_active' => true,
            'sort_order' => 1,
        ])->assertStatus(201);
        $id = $create->json('data.id');

        $this->putJson("/api/admin/cms/banners/{$id}", [
            'position' => 'footer',
            'is_active' => false,
            'sort_order' => 9,
        ])->assertOk()
            ->assertJsonPath('data.position', 'footer')
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.sort_order', 9);

        $this->assertDatabaseHas('cms_banners', [
            'id' => $id,
            'position' => 'footer',
            'is_active' => false,
        ]);
    }

    public function test_announcement_schedule_persists_and_update_enforces_window(): void
    {
        $create = $this->postJson('/api/admin/cms/announcements', [
            'title' => 'Scheduled',
            'content' => 'windowed',
            'priority' => 'high',
            'is_active' => true,
            'starts_at' => '2027-01-01T09:00:00',
            'ends_at' => '2027-01-08T18:00:00',
        ])->assertStatus(201);
        $id = $create->json('data.id');

        $this->assertDatabaseHas('cms_announcements', ['id' => $id, 'priority' => 'high']);

        // The update path now enforces the same window rule as create.
        $this->putJson("/api/admin/cms/announcements/{$id}", [
            'starts_at' => '2027-02-01T09:00:00',
            'ends_at' => '2027-01-31T18:00:00',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['ends_at']);

        $this->putJson("/api/admin/cms/announcements/{$id}", [
            'starts_at' => '2027-02-01T09:00:00',
            'ends_at' => '2027-02-05T18:00:00',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.is_active', false);

        $row = DB::table('cms_announcements')->where('id', $id)->first();
        $this->assertNotFalse($row);
        $this->assertStringContainsString('2027-02-01', (string) $row->starts_at);
        $this->assertStringContainsString('2027-02-05', (string) $row->ends_at);
        $this->assertSame(0, (int) $row->is_active);
    }

    public function test_public_announcement_window_respects_updated_schedule(): void
    {
        // Create an announcement whose window is already in the past…
        $past = $this->postJson('/api/admin/cms/announcements', [
            'title' => 'Expired',
            'starts_at' => '2020-01-01T00:00:00',
            'ends_at' => '2020-01-02T00:00:00',
        ])->assertStatus(201)->json('data.id');

        $public = collect($this->getJson('/api/cms/announcements/public')->json('data'))->pluck('title');
        $this->assertFalse($public->contains('Expired'));

        // …then re-schedule it into an open window through the update API.
        $this->putJson("/api/admin/cms/announcements/{$past}", [
            'starts_at' => now()->subDay()->toIso8601String(),
            'ends_at' => now()->addDay()->toIso8601String(),
            'is_active' => true,
        ])->assertOk();

        $public = collect($this->getJson('/api/cms/announcements/public')->json('data'))->pluck('title');
        $this->assertTrue($public->contains('Expired'));
    }

    private function assertJsonMissingPathValue(array $haystack, string $needle): void
    {
        $this->assertFalse(in_array($needle, $haystack, true), "Did not expect {$needle} in public banners");
    }
}
