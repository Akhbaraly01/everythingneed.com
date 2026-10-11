<?php

namespace Database\Seeders;

use Database\Seeders\Support\PlaceholderArt;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Admin\Entities\MediaItem;

/**
 * Placeholder artwork for every vertical whose cards were image-less:
 * hotels, restaurants, courses, medicines, need items/requests, property
 * listings and CMS banners. Runs after the demo seeders in DatabaseSeeder.
 *
 * Fill-if-empty: rows that already carry a real image_url/images entry are
 * never touched. Generated files live under seed/<plural>/<id>.png on the
 * public disk and get a media-library row (meta.design = 2). Banners render
 * as text-free wide backdrops because BannerSlider overlays its own copy.
 */
class PlaceholderImageSeeder extends Seeder
{
    public function run(): void
    {
        if (! extension_loaded('gd')) {
            $this->command?->warn('GD missing: vertical placeholder images skipped.');

            return;
        }

        $this->fillSquares('hotels', 'image_url', 'seed/hotels', 'HOTEL', 'bed');
        $this->fillSquares('restaurants', 'image_url', 'seed/restaurants', 'RESTAURANT', 'food');
        $this->fillSquares('courses', 'thumbnail_url', 'seed/courses', 'COURSE', 'book');
        $this->fillSquares('medicines', 'image_url', 'seed/medicines', 'PHARMACY', 'pill');
        $this->fillSquares('need_items', 'image_url', 'seed/needs', 'REQUEST', 'bag');
        $this->fillJsonSquares('need_requests', 'images', 'seed/need-requests', 'REQUEST', 'bag');
        $this->fillJsonSquares('properties', 'images', 'seed/properties', 'PROPERTY', 'house');
        // Avatars render as glyph-only art (round crops make big headlines
        // illegible): doctors + service workers whose cards fell back to a
        // gray icon with no photo.
        $this->fillSquares('doctors', 'avatar_url', 'seed/doctors', '', 'user', false);
        $this->fillSquares('service_workers', 'avatar_url', 'seed/service-workers', '', 'user', false);
        $this->fillBanners();
    }

    /** Fill a scalar url column on a table of square (800x800) cards. */
    private function fillSquares(
        string $table,
        string $column,
        string $folder,
        string $eyebrow,
        string $glyph,
        bool $withText = true,
    ): void {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        $rows = DB::table($table)->select($this->selectableColumns($table, $column))->get();

        foreach ($rows as $row) {
            if (! $this->needsFill($row->{$column}, $folder)) {
                continue;
            }

            $title = $this->rowTitle($row);
            $relative = $folder.'/'.$row->id.'.png';

            $bytes = Storage::disk('public')->exists($relative)
                ? Storage::disk('public')->get($relative)
                : PlaceholderArt::render((string) $row->id, $withText ? $title : '', $eyebrow, $glyph);

            if ($bytes === null) {
                continue;
            }

            Storage::disk('public')->put($relative, $bytes);
            DB::table($table)->where('id', $row->id)->update([$column => '/storage/'.$relative]);
            $this->mediaRow($relative, $title, $folder, $eyebrow);
        }
    }

    /** Fill a json-array image column (properties, need requests). */
    private function fillJsonSquares(string $table, string $column, string $folder, string $eyebrow, string $glyph): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        $rows = DB::table($table)->select($this->selectableColumns($table, $column))->get();

        foreach ($rows as $row) {
            $current = $row->{$column};
            $existing = is_array($current) ? $current : (is_string($current) && $current !== '' ? (array) json_decode($current, true) : []);
            $firstUrl = is_string($existing[0] ?? null) ? $existing[0] : null;
            if (! $this->needsFill($firstUrl, $folder) && $existing !== []) {
                continue;
            }

            $title = $this->rowTitle($row);
            $relative = $folder.'/'.$row->id.'.png';

            $bytes = Storage::disk('public')->exists($relative)
                ? Storage::disk('public')->get($relative)
                : PlaceholderArt::render((string) $row->id, $title, $eyebrow, $glyph);

            if ($bytes === null) {
                continue;
            }

            Storage::disk('public')->put($relative, $bytes);
            DB::table($table)->where('id', $row->id)->update([$column => json_encode(['/storage/'.$relative])]);
            $this->mediaRow($relative, $title, $folder, $eyebrow);
        }
    }

    /** Wide, text-free backdrops for the CMS banner slider. */
    private function fillBanners(): void
    {
        if (! Schema::hasTable('cms_banners') || ! Schema::hasColumn('cms_banners', 'image_url')) {
            return;
        }

        $rows = DB::table('cms_banners')->select('id', 'title', 'image_url')->get();

        foreach ($rows as $row) {
            if (! $this->needsFill($row->image_url, 'seed/banners')) {
                continue;
            }

            $relative = 'seed/banners/'.$row->id.'.png';
            $bytes = Storage::disk('public')->exists($relative)
                ? Storage::disk('public')->get($relative)
                : PlaceholderArt::renderBackdrop((string) $row->id.'-'.($row->title ?? ''), 'star');

            if ($bytes === null) {
                continue;
            }

            Storage::disk('public')->put($relative, $bytes);
            DB::table('cms_banners')->where('id', $row->id)->update(['image_url' => '/storage/'.$relative]);
            $this->mediaRow($relative, (string) ($row->title ?? 'Banner'), 'banners', 'OFFER');
        }
    }

    /**
     * Empty/placeholder URLs get filled; URLs pointing into our seed folder
     * are healed when the file vanished; anything else (custom uploads,
     * external URLs) is left alone.
     */
    private function needsFill(?string $url, string $folder): bool
    {
        $url = trim((string) $url);
        if ($url === '' || $url === '/placeholder.svg') {
            return true;
        }
        if (! str_starts_with($url, '/storage/'.$folder.'/')) {
            return false;
        }

        return ! Storage::disk('public')->exists(Str::after($url, '/storage/'));
    }

    /** Prefer title, then name, when the table only carries one of them. */
    private function rowTitle(object $row): string
    {
        foreach (['title', 'name'] as $label) {
            if (property_exists($row, $label) && trim((string) $row->{$label}) !== '') {
                return (string) $row->{$label};
            }
        }

        return '';
    }

    /** id + image column + whichever title/name columns the table has. */
    private function selectableColumns(string $table, string $column): array
    {
        $columns = ['id', $column];
        foreach (['title', 'name'] as $label) {
            if (Schema::hasColumn($table, $label)) {
                $columns[] = $label;
            }
        }

        return $columns;
    }

    private function mediaRow(string $relative, string $title, string $folder, string $eyebrow): void    {
        MediaItem::firstOrCreate(
            ['path' => $relative, 'disk' => 'public'],
            [
                'title' => mb_substr($title !== '' ? $title : $eyebrow, 0, 250),
                'file_name' => basename($relative),
                'mime_type' => 'image/png',
                'size' => (int) Storage::disk('public')->size($relative),
                'width' => str_contains($relative, '/banners/') ? 1200 : 800,
                'height' => str_contains($relative, '/banners/') ? 320 : 800,
                'owner_type' => null,
                'owner_id' => null,
                'meta' => [
                    'folder' => Str::after($folder, 'seed/'),
                    'scope' => 'seed',
                    'design' => 2,
                ],
            ]
        );
    }
}
