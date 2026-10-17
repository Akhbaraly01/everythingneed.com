<?php

namespace Tests\Feature\Products;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class HomeFeedTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');

        $vendor = Vendor::factory()->create();
        Product::factory()->count(20)->create(['vendor_id' => $vendor->id]);
    }

    public function test_guest_feed_returns_card_shape_with_meta(): void
    {
        $res = $this->getJson('/api/home/feed')->assertOk();

        $card = $res->json('data.0');
        foreach (['id', 'name', 'price', 'image', 'category', 'type', 'link'] as $key) {
            $this->assertArrayHasKey($key, $card);
        }
        $this->assertSame('product', $card['type']);
        $this->assertSame(12, count($res->json('data')));
        $this->assertSame(1, $res->json('meta.current_page'));
        $this->assertSame(12, $res->json('meta.per_page'));
        $this->assertSame(20, $res->json('meta.total'));
    }

    public function test_feed_paginates_without_overlap_and_clamps_page_size(): void
    {
        $page1 = collect($this->getJson('/api/home/feed')->json('data'))->pluck('id')->all();
        $page2 = collect($this->getJson('/api/home/feed?page=2')->json('data'))->pluck('id')->all();

        $this->assertCount(12, $page1);
        $this->assertCount(8, $page2);
        $this->assertEmpty(array_intersect($page1, $page2));

        // Absurd sizes clamp to the 1..48 window.
        $this->assertCount(20, $this->getJson('/api/home/feed?per_page=999')->json('data'));
        $this->assertSame(48, $this->getJson('/api/home/feed?per_page=999')->json('meta.per_page'));
    }
}
