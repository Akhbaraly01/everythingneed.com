<?php

namespace Tests\Feature\Web;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Plan G1: the home campaign slider is fed by six active homepage banners.
 * Pins the seeder contract (six rows, distinct deep links, ordered) and the
 * public endpoint shape the slider consumes.
 */
class CampaignBannersTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_provides_six_active_homepage_banners(): void
    {
        $this->seed(\Database\Seeders\CmsSeeder::class);

        $banners = DB::table('cms_banners')
            ->where('position', 'homepage')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $this->assertCount(6, $banners);
        $this->assertSame(6, $banners->pluck('link_url')->unique()->count());

        $res = $this->getJson('/api/cms/banners/public')->assertOk();
        $this->assertCount(6, $res->json('data'));
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(\Database\Seeders\CmsSeeder::class);
        $this->seed(\Database\Seeders\CmsSeeder::class);

        $this->assertSame(6, (int) DB::table('cms_banners')
            ->where('position', 'homepage')
            ->where('is_active', true)
            ->count());
    }
}
