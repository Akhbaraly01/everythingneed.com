<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Home page builder defaults: the storefront scroll order from the Home
 * rebuild (products interleaved between category sections). Slugs map to
 * HomePageController section builders; `order` is the render sequence.
 * Idempotent: existing slugs are never duplicated, only missing ones added.
 */
class HomePageSectionsSeeder extends Seeder
{
    /**
     * @var list<array{name: string, slug: string}>
     */
    public const DEFAULTS = [
        ['name' => 'Featured Products', 'slug' => 'featured'],
        ['name' => 'Deals', 'slug' => 'deals'],
        ['name' => 'Services', 'slug' => 'services'],
        ['name' => 'Healthcare', 'slug' => 'healthcare'],
        ['name' => 'Jobs', 'slug' => 'jobs'],
        ['name' => 'Hotels', 'slug' => 'hotels'],
        ['name' => 'Transportation', 'slug' => 'transportation'],
        ['name' => 'Food', 'slug' => 'food'],
        ['name' => 'Agriculture', 'slug' => 'agriculture'],
        ['name' => 'Real Estate', 'slug' => 'real-estate'],
        ['name' => 'Building Services', 'slug' => 'building-services'],
        ['name' => 'Learn', 'slug' => 'learn'],
        ['name' => 'Daily Deals', 'slug' => 'daily-deals'],
        ['name' => 'Recently Added', 'slug' => 'recently-added'],
    ];

    public function run(): void
    {
        $order = 0;
        foreach (self::DEFAULTS as $row) {
            $order++;
            $exists = DB::table('home_page_sections')->where('slug', $row['slug'])->exists();

            if ($exists) {
                continue;
            }

            DB::table('home_page_sections')->insert([
                'id' => (string) Str::uuid(),
                'name' => $row['name'],
                'slug' => $row['slug'],
                'is_active' => true,
                'order' => $order,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Storefront batch size for the interleaved product grid. Seeded only
        // when missing — Super Admin owns the value afterwards via Settings.
        $hasBatch = DB::table('system_settings')->where('key', 'home.products_per_batch')->exists();
        if (! $hasBatch) {
            DB::table('system_settings')->insert([
                'id' => (string) Str::uuid(),
                'key' => 'home.products_per_batch',
                'value' => '12',
                'updated_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            Cache::forget('admin_system_settings');
        }
    }
}
