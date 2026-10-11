<?php

namespace Tests\Feature\Upload;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Admin\Entities\MediaItem;
use Tests\TestCase;

/**
 * Personal upload pipeline (W1): /api/upload images flow through the GD
 * pipeline (capped at 2048px) while the response shape and the own-scope
 * guarantees stay byte-compatible with the pinned security tests.
 */
class MediaUploadPipelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_huge_user_upload_is_capped_and_recorded(): void
    {
        $user = User::factory()->create();

        $res = $this->actingAs($user)->postJson('/api/upload', [
            'file' => UploadedFile::fake()->image('camera.jpg', 3000, 2000),
            'folder' => 'evidence',
        ])->assertStatus(201);

        $path = $res->json('data.path');
        $this->assertStringStartsWith("uploads/u/{$user->id}/evidence/", $path);
        Storage::disk('public')->assertExists($path);

        [$w, $h] = getimagesize(Storage::disk('public')->path($path));
        $this->assertSame(2048, $w);
        $this->assertSame(1365, $h);

        $item = MediaItem::where('path', $path)->firstOrFail();
        $this->assertSame(2048, $item->width);
        $this->assertSame(1365, $item->height);
        $this->assertStringStartsWith('image/', $item->mime_type);
    }

    public function test_response_shape_is_unchanged(): void
    {
        $user = User::factory()->create();

        $res = $this->actingAs($user)->postJson('/api/upload', [
            'file' => UploadedFile::fake()->image('photo.jpg', 640, 480),
        ])->assertStatus(201);

        $data = $res->json('data');
        foreach (['url', 'path', 'name', 'size', 'mime_type'] as $key) {
            $this->assertArrayHasKey($key, $data);
        }
        $this->assertSame('photo.jpg', $data['name']);
        $this->assertSame('image/jpeg', $data['mime_type']);
        $this->assertGreaterThan(0, $data['size']);
    }

    public function test_small_upload_keeps_exact_dimensions(): void
    {
        $user = User::factory()->create();

        $path = $this->actingAs($user)->postJson('/api/upload', [
            'file' => UploadedFile::fake()->image('small.jpg', 640, 480),
        ])->assertStatus(201)->json('data.path');

        $item = MediaItem::where('path', $path)->firstOrFail();
        $this->assertSame(640, $item->width);
        $this->assertSame(480, $item->height);
    }
}
