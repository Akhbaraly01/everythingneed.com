<?php

namespace Tests\Feature\Upload;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Admin\Entities\MediaItem;
use Tests\TestCase;

/**
 * W1: media:backfill-orphans registers disk files that lack a
 * media_library row, skips known files and .gitignore, and creates
 * nothing under --dry-run.
 */
class MediaBackfillTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_orphan_files_are_registered_with_real_metadata(): void
    {
        Storage::disk('public')->put('legacy/banner.jpg', 'not-a-real-image');
        Storage::disk('public')->put('.gitignore', "*\n");
        $image = UploadedFile::fake()->image('pic.jpg', 800, 600);
        Storage::disk('public')->putFileAs('legacy', $image, 'pic.jpg');

        $this->artisan('media:backfill-orphans')->assertSuccessful();

        $this->assertSame(2, MediaItem::count());

        $banner = MediaItem::where('path', 'legacy/banner.jpg')->firstOrFail();
        $this->assertSame('banner', $banner->title);
        $this->assertSame('backfill', $banner->meta['scope']);

        $pic = MediaItem::where('path', 'legacy/pic.jpg')->firstOrFail();
        $this->assertStringStartsWith('image/', $pic->mime_type);
        $this->assertSame(800, $pic->width);
        $this->assertSame(600, $pic->height);
    }

    public function test_second_run_creates_no_duplicates(): void
    {
        Storage::disk('public')->put('legacy/once.txt', 'x');

        $this->artisan('media:backfill-orphans')->assertSuccessful();
        $this->artisan('media:backfill-orphans')->assertSuccessful();

        $this->assertSame(1, MediaItem::where('path', 'legacy/once.txt')->count());
    }

    public function test_dry_run_creates_nothing(): void
    {
        Storage::disk('public')->put('legacy/dry.txt', 'x');

        $this->artisan('media:backfill-orphans', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(0, MediaItem::count());
    }
}
