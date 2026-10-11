<?php

namespace Tests\Feature\Upload;

use Core\Services\Contracts\MediaServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Native-GD media pipeline (W1): resize, pass-through and delete behaviour
 * of Core\Services\MediaService. Runs against a faked public disk.
 */
class MediaServiceGdTest extends TestCase
{
    use RefreshDatabase;

    private MediaServiceInterface $media;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->media = app(MediaServiceInterface::class);
    }

    public function test_jpeg_resizes_to_max_width_preserving_aspect(): void
    {
        $file = UploadedFile::fake()->image('photo.jpg', 2000, 1500);

        $result = $this->media->upload('gallery', $file, ['disk' => 'public', 'max_width' => 800]);

        $this->assertArrayHasKey('path', $result);
        $this->assertArrayHasKey('url', $result);
        $this->assertArrayHasKey('size', $result);
        $this->assertArrayHasKey('mime_type', $result);
        Storage::disk('public')->assertExists($result['path']);

        [$w, $h] = getimagesize(Storage::disk('public')->path($result['path']));
        $this->assertSame(800, $w);
        $this->assertSame(600, $h); // 4:3 aspect preserved
        $this->assertSame('image/jpeg', $result['mime_type']);
        $this->assertGreaterThan(0, $result['size']);
    }

    public function test_png_resizes_to_max_height_without_upscaling(): void
    {
        $file = UploadedFile::fake()->image('tall.png', 400, 1200);

        $result = $this->media->upload('gallery', $file, ['disk' => 'public', 'max_height' => 600]);

        [$w, $h] = getimagesize(Storage::disk('public')->path($result['path']));
        $this->assertSame(200, $w);
        $this->assertSame(600, $h);
        $this->assertSame('image/png', $result['mime_type']);
    }

    public function test_small_image_is_never_upscaled(): void
    {
        $file = UploadedFile::fake()->image('tiny.jpg', 120, 90);

        $result = $this->media->upload('gallery', $file, ['disk' => 'public', 'max_width' => 1600, 'max_height' => 1600]);

        [$w, $h] = getimagesize(Storage::disk('public')->path($result['path']));
        $this->assertSame(120, $w);
        $this->assertSame(90, $h);
    }

    public function test_gif_passes_through_unresized_to_protect_animation(): void
    {
        $file = UploadedFile::fake()->image('anim.gif', 900, 900);

        $result = $this->media->upload('gallery', $file, ['disk' => 'public', 'max_width' => 100]);

        [$w, $h] = getimagesize(Storage::disk('public')->path($result['path']));
        $this->assertSame(900, $w);
        $this->assertSame(900, $h);
    }

    public function test_non_image_stores_untouched_even_with_dims_requested(): void
    {
        $file = UploadedFile::fake()->create('report.pdf', 50, 'application/pdf');

        $result = $this->media->upload('docs', $file, ['disk' => 'public', 'max_width' => 800]);

        Storage::disk('public')->assertExists($result['path']);
        $this->assertSame('application/pdf', $result['mime_type']);
    }

    public function test_string_payload_uses_put_branch(): void
    {
        $result = $this->media->upload('docs/note.txt', 'raw contents', ['disk' => 'public']);

        $this->assertSame('docs/note.txt', $result['path']);
        $this->assertSame('raw contents', Storage::disk('public')->get($result['path']));
    }

    public function test_delete_removes_stored_file_and_get_url_resolves(): void
    {
        $file = UploadedFile::fake()->image('gone.jpg', 300, 200);
        $result = $this->media->upload('gallery', $file, ['disk' => 'public']);

        $this->assertStringContainsString($result['path'], $this->media->getUrl($result['path'], 'public'));

        $this->media->delete($result['path'], 'public');
        Storage::disk('public')->assertMissing($result['path']);
    }

    public function test_default_disk_roundtrip_uses_app_default(): void
    {
        Storage::fake('local');
        $this->assertSame('local', config('filesystems.default'));

        $file = UploadedFile::fake()->image('plain.jpg', 500, 400);
        $result = $this->media->upload('gallery', $file);

        Storage::disk('local')->assertExists($result['path']);
        $this->media->delete($result['path']);
        Storage::disk('local')->assertMissing($result['path']);
    }

    public function test_corrupt_image_falls_back_to_plain_store(): void
    {
        $broken = tempnam(sys_get_temp_dir(), 'broken').'.jpg';
        file_put_contents($broken, 'not-an-image-at-all');
        $file = new UploadedFile($broken, 'broken.jpg', 'image/jpeg', null, true);

        $result = $this->media->upload('gallery', $file, ['disk' => 'public', 'max_width' => 100]);

        Storage::disk('public')->assertExists($result['path']);
        @unlink($broken);
    }
}
