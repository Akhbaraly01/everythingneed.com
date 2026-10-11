<?php

namespace Database\Seeders;

use Database\Seeders\Support\PlaceholderArt;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\Admin\Entities\MediaItem;

/**
 * Local product imagery (design v2).
 *
 * Faker's imageUrl() (and the old via.placeholder.com habit) leaves product
 * rows pointing at a dead external service; the v1 fallback was a pale
 * washed-out gradient with tiny built-in-font text that was unreadable at
 * card sizes. v2 renders a high-contrast dark gradient + large glyph + bold
 * TTF headline via PlaceholderArt, stores it under seed/products/ on the
 * public disk, points image_url at it and records a media-library row.
 *
 * Idempotent: rows already on design v2 files are untouched; older designs
 * are regenerated (the media row carries meta.design).
 */
class ProductImageSeeder extends Seeder
{
    public const DESIGN_VERSION = 2;

    public function run(): void
    {
        if (! extension_loaded('gd')) {
            $this->command?->warn('GD missing: product images left as-is.');

            return;
        }

        $products = DB::table('products')->select('id', 'name', 'category', 'image_url')->get();

        foreach ($products as $product) {
            $relative = 'seed/products/'.$product->id.'.png';
            $absolute = '/storage/'.$relative;
            $media = MediaItem::where('path', $relative)->where('disk', 'public')->first();
            $meta = $media?->meta;
            $design = is_array($meta) ? (int) ($meta['design'] ?? 0) : 0;

            $fileExists = Storage::disk('public')->exists($relative);
            $urlCurrent = $product->image_url === $absolute;

            if ($urlCurrent && $fileExists && $design >= self::DESIGN_VERSION) {
                continue;
            }

            $bytes = ($fileExists && $design >= self::DESIGN_VERSION)
                ? Storage::disk('public')->get($relative)
                : null;

            if ($bytes === null) {
                $bytes = PlaceholderArt::render(
                    (string) $product->id,
                    (string) ($product->name ?? 'Product'),
                    (string) ($product->category ?? 'Product'),
                    'box',
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
                    'file_name' => $product->id.'.png',
                    'mime_type' => 'image/png',
                    'size' => (int) Storage::disk('public')->size($relative),
                    'width' => 800,
                    'height' => 800,
                    'owner_type' => null,
                    'owner_id' => null,
                    'meta' => [
                        'folder' => 'products',
                        'scope' => 'seed',
                        'design' => self::DESIGN_VERSION,
                    ],
                ]
            );
        }
    }
}
