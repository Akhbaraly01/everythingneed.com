<?php

namespace Database\Seeders;

use Database\Seeders\Support\PlaceholderArt;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Admin\Entities\MediaItem;

/**
 * Local product imagery (design v4).
 *
 * Faker's imageUrl() (and the old via.placeholder.com habit) leaves product
 * rows pointing at a dead external service; the v1 fallback was a pale
 * washed-out gradient with tiny built-in-font text that was unreadable at
 * card sizes. v2 rendered a high-contrast dark gradient + large glyph + bold
 * TTF headline via PlaceholderArt, but every product shared the same package
 * glyph. v3 made it type-aware (cloth shows cloth, electronics shows the
 * device). v4 renders an ecommerce-style studio shot with the shaded glyph
 * and no baked-in text (see PlaceholderArt::renderProduct).
 *
 * REAL PHOTOS WIN: files dropped into database/seeders/assets/products/
 * under the product's id or slug name — `{id}.jpg|jpeg|png|webp` or
 * `{slug}.jpg|jpeg|png|webp` — are copied to seed/products/ as-is (correct
 * extension and mime recorded in the media library, meta.source = "photo").
 * Only products without a photo get generated art (meta.source =
 * "generated"). Stored under seed/products/ on the public disk, pointed at
 * from image_url, recorded in the media library.
 *
 * Idempotent: rows already on design v4 files for the right product and
 * source are untouched; older designs are regenerated (the media row carries
 * meta.design).
 */
class ProductImageSeeder extends Seeder
{
    public const DESIGN_VERSION = 4;

    /** Photo lookup order for one product: id first, then slug name. */
    private const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    /** Absolute override directory (tests); null = the repository folder. */
    public static ?string $photoDir = null;

    public function run(): void
    {
        if (! extension_loaded('gd')) {
            $this->command?->warn('GD missing: product images left as-is.');

            return;
        }

        $products = DB::table('products')->select('id', 'name', 'category', 'image_url')->get();

        foreach ($products as $product) {
            $photo = $this->findPhoto($product);
            $ext = $photo !== null ? strtolower(pathinfo($photo, PATHINFO_EXTENSION)) : 'png';
            $relative = 'seed/products/'.$product->id.'.'.$ext;
            $absolute = '/storage/'.$relative;
            $media = MediaItem::where('path', $relative)->where('disk', 'public')->first();
            $meta = $media?->meta;
            $design = is_array($meta) ? (int) ($meta['design'] ?? 0) : 0;

            $fileExists = Storage::disk('public')->exists($relative);
            $urlCurrent = $product->image_url === $absolute;

            if ($urlCurrent && $fileExists && $design >= self::DESIGN_VERSION) {
                continue;
            }

            $bytes = null;
            $mime = 'image/png';
            $width = 800;
            $height = 800;

            if ($photo !== null) {
                $bytes = (string) file_get_contents($photo);
                $info = @getimagesize($photo);
                if (is_array($info)) {
                    $width = (int) $info[0];
                    $height = (int) $info[1];
                    $mime = (string) ($info['mime'] ?? $mime);
                }
                // A real photo replaces any stale generated PNG for this id.
                if ($ext !== 'png') {
                    $this->dropStaleGenerated($product->id);
                }
            } elseif ($fileExists && $design >= self::DESIGN_VERSION) {
                $bytes = Storage::disk('public')->get($relative);
            }

            if ($bytes === null) {
                $bytes = PlaceholderArt::renderProduct(
                    (string) $product->id,
                    (string) ($product->name ?? 'Product'),
                    (string) ($product->category ?? ''),
                );
            }

            if ($bytes === null) {
                DB::table('products')->where('id', $product->id)->update(['image_url' => '/placeholder.svg']);

                continue;
            }

            Storage::disk('public')->put($relative, $bytes);
            DB::table('products')->where('id', $product->id)->update(['image_url' => $absolute]);

            MediaItem::updateOrCreate(
                ['path' => $relative, 'disk' => 'public'],
                [
                    'title' => mb_substr((string) ($product->name ?? 'Product'), 0, 250),
                    'file_name' => $product->id.'.'.$ext,
                    'mime_type' => $mime,
                    'size' => strlen($bytes),
                    'width' => $width,
                    'height' => $height,
                    'owner_type' => null,
                    'owner_id' => null,
                    'meta' => [
                        'folder' => 'products',
                        'scope' => 'seed',
                        'design' => self::DESIGN_VERSION,
                        'source' => $photo !== null ? 'photo' : 'generated',
                    ],
                ]
            );
        }
    }

    /** First real photo for the product: {id}.{ext}, then {slug}.{ext}. */
    private function findPhoto(object $product): ?string
    {
        $dir = self::$photoDir ?? base_path('database/seeders/assets/products');
        if (! is_dir($dir)) {
            return null;
        }

        $names = [(string) $product->id];
        $slug = Str::slug((string) ($product->name ?? ''));
        if ($slug !== '' && $slug !== (string) $product->id) {
            $names[] = $slug;
        }

        foreach ($names as $name) {
            foreach (self::PHOTO_EXTENSIONS as $ext) {
                $path = $dir.DIRECTORY_SEPARATOR.$name.'.'.$ext;
                if (is_file($path)) {
                    return $path;
                }
            }
        }

        return null;
    }

    /** Remove the superseded generated PNG + media row when a photo takes over. */
    private function dropStaleGenerated(string|int $productId): void
    {
        $stale = 'seed/products/'.$productId.'.png';
        if (Storage::disk('public')->exists($stale)) {
            Storage::disk('public')->delete($stale);
        }
        MediaItem::where('path', $stale)->where('disk', 'public')->delete();
    }
}
