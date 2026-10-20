<?php

namespace Database\Seeders;

use Database\Factories\ProductFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * L-H-1 backfill: rename lorem-faker product rows to the real demo catalogue.
 *
 * Early DB seeds created products through ProductFactory with three random
 * faker words as the name ("officiis debitis mollitia"), which no artwork or
 * shopper can make sense of. This seeder only touches rows whose name is
 * still all-lowercase lorem (no digits, no capitals), assigns the next
 * category-appropriate catalogue name, and refreshes description + slug.
 * Idempotent: renamed rows no longer match the lorem pattern.
 */
class DemoCatalogRefreshSeeder extends Seeder
{
    public function run(): void
    {
        $products = DB::table('products')
            ->orderBy('created_at')
            ->get(['id', 'name', 'category', 'slug']);

        $counters = [];
        $renamed = 0;

        foreach ($products as $product) {
            $name = (string) ($product->name ?? '');

            // Lorem names are lowercase words only (e.g. "officiis debitis mollitia").
            if ($name === '' || ! preg_match('/^[a-z][a-z ]+$/', $name)) {
                continue;
            }

            $names = ProductFactory::catalogNames((string) $product->category);
            if ($names === []) {
                continue;
            }

            $index = $counters[$product->category] ?? 0;
            $counters[$product->category] = $index + 1;
            $newName = $names[$index % count($names)];

            DB::table('products')->where('id', $product->id)->update([
                'name' => $newName,
                'description' => $newName.' — a customer-favourite '
                    .$product->category.' pick, quality checked before dispatch.',
                'slug' => Str::slug($newName).'-'.substr((string) $product->id, 0, 8),
                'updated_at' => now(),
            ]);

            $renamed++;
        }

        $this->command?->info("Demo catalogue refresh: {$renamed} product(s) renamed.");
    }
}
