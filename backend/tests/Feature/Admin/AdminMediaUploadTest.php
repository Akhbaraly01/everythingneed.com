<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Modules\Admin\Entities\MediaItem;
use Tests\TestCase;

/**
 * Shared-library upload (W1): POST /api/admin/media is permission-gated
 * (media.manage + manageCms) and stores under library/{folder} with GD
 * capping. Personal /api/upload behaviour is untouched.
 */
class AdminMediaUploadTest extends TestCase
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

    public function test_library_upload_caps_huge_images_and_records_item(): void
    {
        $admin = $this->actingAsRole('content_manager');

        $res = $this->postJson('/api/admin/media', [
            'file' => UploadedFile::fake()->image('banner.jpg', 2400, 1200),
            'folder' => 'banners',
        ])->assertStatus(201);

        $path = $res->json('data.path');
        $this->assertStringStartsWith('library/banners/', $path);
        Storage::disk('public')->assertExists($path);

        [$w, $h] = getimagesize(Storage::disk('public')->path($path));
        $this->assertSame(1920, $w);
        $this->assertSame(960, $h);

        $item = MediaItem::where('path', $path)->first();
        $this->assertNotNull($item);
        $this->assertSame('user', $item->owner_type);
        $this->assertSame($admin->id, $item->owner_id);
        $this->assertSame(1920, $item->width);
        $this->assertSame(960, $item->height);
        $this->assertSame('banners', $item->meta['folder']);
        $this->assertSame('library', $item->meta['scope']);

        $this->assertNotEmpty($res->json('data.id'));
        $this->assertNotEmpty($res->json('data.url'));
    }

    public function test_plain_user_cannot_upload_to_library(): void
    {
        $this->actingAsRole('user');

        $this->postJson('/api/admin/media', [
            'file' => UploadedFile::fake()->image('nope.jpg', 100, 100),
        ])->assertForbidden();

        $this->assertSame(0, MediaItem::count());
    }

    public function test_guest_cannot_upload_to_library(): void
    {
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/admin/media', [
            'file' => UploadedFile::fake()->image('nope.jpg', 100, 100),
        ])->assertUnauthorized();
    }

    public function test_folder_outside_allowlist_is_rejected(): void
    {
        $this->actingAsRole('content_manager');

        $this->postJson('/api/admin/media', [
            'file' => UploadedFile::fake()->image('escape.jpg', 100, 100),
            'folder' => 'system',
        ])->assertStatus(422)->assertJsonValidationErrors(['folder']);

        $this->assertSame(0, MediaItem::count());
    }

    public function test_library_search_filters_by_title_and_filename(): void
    {
        $this->actingAsRole('content_manager');

        $this->postJson('/api/admin/media', [
            'file' => UploadedFile::fake()->image('sunset.jpg', 100, 100),
            'folder' => 'banners',
            'title' => 'Harvest sunset banner',
        ])->assertStatus(201);
        $this->postJson('/api/admin/media', [
            'file' => UploadedFile::fake()->image('invoice.jpg', 100, 100),
            'folder' => 'library',
        ])->assertStatus(201);

        $hits = $this->getJson('/api/admin/media?search=sunset')->assertOk()->json('data.data');
        $this->assertCount(1, $hits);
        $this->assertSame('Harvest sunset banner', $hits[0]['title']);

        $all = $this->getJson('/api/admin/media')->assertOk()->json('data.data');
        $this->assertCount(2, $all);
    }

    public function test_pdf_passes_through_library_without_dimensions(): void
    {
        $this->actingAsRole('content_manager');

        $res = $this->postJson('/api/admin/media', [
            'file' => UploadedFile::fake()->create('terms.pdf', 80, 'application/pdf'),
            'folder' => 'cms',
            'title' => 'Terms',
        ])->assertStatus(201);

        $item = MediaItem::where('path', $res->json('data.path'))->firstOrFail();
        $this->assertSame('application/pdf', $item->mime_type);
        $this->assertNull($item->width);
        $this->assertNull($item->height);
        $this->assertSame('Terms', $item->title);
    }
}
