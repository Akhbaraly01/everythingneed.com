<?php

namespace Tests\Feature\Seed;

use Database\Seeders\ProductImageSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Modules\Admin\Entities\MediaItem;
use Modules\Products\Entities\Product;
use Tests\TestCase;

/**
 * L-H-6: seeded product imagery is real-photo-first with a type-aware
 * generated fallback, and re-runs stay idempotent.
 */
class ProductImageSeederTest extends TestCase
{
    use RefreshDatabase;

    private ?string $tmpDir = null;

    protected function tearDown(): void
    {
        ProductImageSeeder::$photoDir = null;

        if ($this->tmpDir !== null && is_dir($this->tmpDir)) {
            foreach (glob($this->tmpDir.DIRECTORY_SEPARATOR.'*') ?: [] as $file) {
                unlink($file);
            }
            rmdir($this->tmpDir);
        }

        parent::tearDown();
    }

    public function test_a_real_photo_for_the_product_id_is_copied_and_recorded(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension not available.');
        }

        Storage::fake('public');
        $vendor = $this->createVendor($this->createUser());
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Smartphone 128GB',
            'category' => 'electronics',
        ]);

        $this->tmpDir = $this->makePhotoDir();
        $photo = $this->tmpDir.DIRECTORY_SEPARATOR.$product->id.'.jpg';
        $img = imagecreatetruecolor(64, 48);
        imagejpeg($img, $photo, 90);
        imagedestroy($img);

        ProductImageSeeder::$photoDir = $this->tmpDir;
        $this->seed(ProductImageSeeder::class);

        $relative = 'seed/products/'.$product->id.'.jpg';
        Storage::disk('public')->assertExists($relative);
        $this->assertSame('/storage/'.$relative, $product->fresh()->image_url);

        $media = MediaItem::where('path', $relative)->where('disk', 'public')->firstOrFail();
        $this->assertSame('image/jpeg', $media->mime_type);
        $this->assertSame('photo', $media->meta['source']);
        $this->assertSame(ProductImageSeeder::DESIGN_VERSION, (int) $media->meta['design']);
    }

    public function test_products_without_a_photo_get_generated_art_and_reruns_are_idempotent(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension not available.');
        }

        Storage::fake('public');
        $vendor = $this->createVendor($this->createUser());
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Classic Cotton T-Shirt',
            'category' => 'clothing',
        ]);

        $this->tmpDir = $this->makePhotoDir();
        ProductImageSeeder::$photoDir = $this->tmpDir;

        $this->seed(ProductImageSeeder::class);

        $relative = 'seed/products/'.$product->id.'.png';
        Storage::disk('public')->assertExists($relative);
        $bytes = Storage::disk('public')->get($relative);
        $this->assertSame("\x89PNG", substr($bytes, 0, 4));
        $this->assertSame('/storage/'.$relative, $product->fresh()->image_url);

        $media = MediaItem::where('path', $relative)->where('disk', 'public')->firstOrFail();
        $this->assertSame('generated', $media->meta['source']);

        $this->seed(ProductImageSeeder::class);

        $this->assertSame($bytes, Storage::disk('public')->get($relative));
        $this->assertSame(1, MediaItem::where('path', $relative)->count());
    }

    private function makePhotoDir(): string
    {
        $dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'en-seed-photos-'.uniqid();
        mkdir($dir);

        return $dir;
    }
}
