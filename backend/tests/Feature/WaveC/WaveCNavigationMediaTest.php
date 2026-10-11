<?php

namespace Tests\Feature\WaveC;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Admin\Entities\MediaItem;
use Modules\Admin\Entities\NavigationItem;
use Tests\TestCase;

/**
 * Wave C - navigation builder API (spec S46) and media library
 * (spec S44/S86): full-replacement item upserts with cycle/parent guards,
 * role-scoped access, upload -> MediaItem recording and delete ownership.
 */
class WaveCNavigationMediaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
        Storage::fake('public');
    }

    private function actingAsRole(string $role): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => $role]);
        $this->app['auth']->forgetGuards();
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    private function createNavigation(string $name = 'Header Menu'): string
    {
        return $this->postJson('/api/admin/navigations', [
            'name' => $name,
            'location' => 'header',
            'status' => 'published',
        ])->assertStatus(201)->json('data.id');
    }

    // ── Navigation ───────────────────────────────────────────────────────────

    public function test_navigation_crud_and_item_replacement(): void
    {
        $this->actingAsRole('content_manager');
        $navId = $this->createNavigation();

        $parentId = (string) Str::uuid();
        $childId = (string) Str::uuid();

        $this->putJson("/api/admin/navigations/{$navId}/items", [
            'items' => [
                ['id' => $parentId, 'title' => 'Products', 'url' => '/products', 'sort_order' => 1],
                ['id' => $childId, 'title' => 'Electronics', 'page_slug' => 'electronics', 'parent_id' => $parentId, 'sort_order' => 1],
            ],
        ])->assertOk()->assertJsonPath('message', 'Navigation items saved');

        $this->assertDatabaseHas('navigation_items', ['id' => $parentId, 'title' => 'Products', 'url' => '/products']);
        $this->assertDatabaseHas('navigation_items', ['id' => $childId, 'parent_id' => $parentId, 'page_slug' => 'electronics']);

        // Full replacement: dropping the child removes it.
        $this->putJson("/api/admin/navigations/{$navId}/items", [
            'items' => [['id' => $parentId, 'title' => 'Products', 'url' => '/products']],
        ])->assertOk();

        $this->assertNull(NavigationItem::find($childId));
        $this->assertNotNull(NavigationItem::find($parentId));

        $this->putJson("/api/admin/navigations/{$navId}", ['name' => 'Main Menu'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Main Menu');

        $this->deleteJson("/api/admin/navigations/{$navId}")->assertOk();
        $this->assertNull(NavigationItem::find($parentId));
        $this->assertSoftDeleted('navigations', ['id' => $navId]);
    }

    public function test_navigation_location_is_validated(): void
    {
        $this->actingAsRole('content_manager');

        $this->postJson('/api/admin/navigations', [
            'name' => 'Bad',
            'location' => 'nowhere',
        ])->assertStatus(422)->assertJsonValidationErrors(['location']);
    }

    public function test_every_item_needs_a_destination(): void
    {
        $this->actingAsRole('content_manager');
        $navId = $this->createNavigation();

        $this->putJson("/api/admin/navigations/{$navId}/items", [
            'items' => [['id' => (string) Str::uuid(), 'title' => 'Lost']],
        ])->assertStatus(422)->assertJsonValidationErrors(['items.0.url']);
    }

    public function test_duplicate_item_ids_are_rejected(): void
    {
        $this->actingAsRole('content_manager');
        $navId = $this->createNavigation();
        $id = (string) Str::uuid();

        $this->putJson("/api/admin/navigations/{$navId}/items", [
            'items' => [
                ['id' => $id, 'title' => 'One', 'url' => '/one'],
                ['id' => $id, 'title' => 'Two', 'url' => '/two'],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors(['items']);
    }

    public function test_parent_guards_reject_self_foreign_and_cycles(): void
    {
        $this->actingAsRole('content_manager');
        $navId = $this->createNavigation();

        $a = (string) Str::uuid();
        $b = (string) Str::uuid();
        $selfParent = (string) Str::uuid();

        // Self parent.
        $this->putJson("/api/admin/navigations/{$navId}/items", [
            'items' => [['id' => $selfParent, 'title' => 'Loop', 'url' => '/loop', 'parent_id' => $selfParent]],
        ])->assertStatus(422)->assertJsonValidationErrors(['items.0.parent_id']);

        // Parent outside this payload.
        $this->putJson("/api/admin/navigations/{$navId}/items", [
            'items' => [['id' => $a, 'title' => 'One', 'url' => '/one', 'parent_id' => (string) Str::uuid()]],
        ])->assertStatus(422)->assertJsonValidationErrors(['items.0.parent_id']);

        // A <-> B cycle.
        $res = $this->putJson("/api/admin/navigations/{$navId}/items", [
            'items' => [
                ['id' => $a, 'title' => 'One', 'url' => '/one', 'parent_id' => $b],
                ['id' => $b, 'title' => 'Two', 'url' => '/two', 'parent_id' => $a],
            ],
        ]);
        $res->assertStatus(422);
        $this->assertStringContainsString('cycle', json_encode($res->json('errors')));
    }

    public function test_navigation_routes_enforce_gate_and_granular_permissions(): void
    {
        // Guest -> 401.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/admin/navigations')->assertUnauthorized();

        // Plain user -> 403 (fails manageCms gate).
        $this->actingAsRole('user');
        $this->getJson('/api/admin/navigations')->assertForbidden();

        // cms_editor holds navigation.view but not navigation.manage.
        $this->actingAsRole('cms_editor');
        $this->getJson('/api/admin/navigations')->assertOk();
        $this->postJson('/api/admin/navigations', ['name' => 'Nope', 'location' => 'footer'])->assertForbidden();
    }

    // ── Media library ────────────────────────────────────────────────────────

    public function test_upload_records_a_media_library_item(): void
    {
        $user = $this->actingAsRole('user');

        $res = $this->postJson('/api/upload', [
            'file' => UploadedFile::fake()->image('photo.jpg', 640, 480),
        ])->assertStatus(201);

        $path = $res->json('data.path');
        Storage::disk('public')->assertExists($path);

        $item = MediaItem::where('path', $path)->first();
        $this->assertNotNull($item, 'Uploads must be recorded in the media library');
        $this->assertSame('user', $item->owner_type);
        $this->assertSame($user->id, $item->owner_id);
        $this->assertStringStartsWith('image/', $item->mime_type);
        $this->assertSame(640, $item->width);
        $this->assertSame(480, $item->height);
    }

    public function test_svg_and_executable_uploads_are_rejected(): void
    {
        $this->actingAsRole('user');

        $this->postJson('/api/upload', [
            'file' => UploadedFile::fake()->createWithContent('evil.svg', '<svg onload="alert(1)"></svg>'),
        ])->assertStatus(422)->assertJsonValidationErrors(['file']);

        $this->postJson('/api/upload', [
            'file' => UploadedFile::fake()->createWithContent('shell.php', '<?php echo 1; ?>'),
        ])->assertStatus(422)->assertJsonValidationErrors(['file']);

        $this->assertSame(0, MediaItem::count());
    }

    public function test_media_library_scoping_and_delete_ownership(): void
    {
        // Two editors each upload one file.
        $editorA = User::factory()->create();
        UserRole::create(['user_id' => $editorA->id, 'role' => 'cms_editor']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($editorA, 'sanctum');
        $pathA = $this->postJson('/api/upload', ['file' => UploadedFile::fake()->image('a.jpg')])
            ->assertStatus(201)->json('data.path');

        $editorB = User::factory()->create();
        UserRole::create(['user_id' => $editorB->id, 'role' => 'cms_editor']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($editorB, 'sanctum');
        $pathB = $this->postJson('/api/upload', ['file' => UploadedFile::fake()->image('b.jpg')])
            ->assertStatus(201)->json('data.path');

        $idA = MediaItem::where('path', $pathA)->firstOrFail()->id;
        $idB = MediaItem::where('path', $pathB)->firstOrFail()->id;

        // A cms_editor (not a library admin) sees only their own uploads.
        $this->app['auth']->forgetGuards();
        $this->actingAs($editorA, 'sanctum');
        $ids = collect($this->getJson('/api/admin/media')->assertOk()->json('data.data'))->pluck('id');
        $this->assertTrue($ids->contains($idA));
        $this->assertFalse($ids->contains($idB));

        // Editor A may not delete editor B's media (has media.manage but no ownership).
        $this->deleteJson("/api/admin/media/{$idB}")->assertForbidden();
        $this->assertNotNull(MediaItem::find($idB));

        // A content_manager (library admin, not platform admin) is still not the owner.
        $this->actingAsRole('content_manager');
        $this->deleteJson("/api/admin/media/{$idB}")->assertForbidden();

        // The platform admin can moderate any upload.
        $this->actingAsRole('super_admin');
        $this->deleteJson("/api/admin/media/{$idB}")->assertOk();
        $this->assertNull(MediaItem::find($idB));
        Storage::disk('public')->assertMissing($pathB);

        // Unauthenticated -> 401.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/admin/media')->assertUnauthorized();
    }
}
