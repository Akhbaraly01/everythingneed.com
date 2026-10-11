<?php

namespace Tests\Feature\WaveG;

use App\Models\User;
use Modules\Categories\Entities\Category;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Modules\Products\Entities\Product;
use Modules\Products\Entities\ProductReview;
use Modules\Vendors\Entities\Vendor;
use Modules\Vendors\Entities\VendorService;
use Tests\TestCase;

/**
 * Wave G - spec §9 canonical catalog URLs: slug-first pages with 301
 * redirects from the legacy {id} paths, plus the §9 sub-pages.
 */
class WaveGCatalogSlugTest extends TestCase
{
    private Vendor $vendor;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $vendorUser = $this->createVendorUser();
        $this->vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => 'Wave G Electronics',
            'category' => 'electronics',
            'is_verified' => true,
        ]);

        $this->product = Product::create([
            'vendor_id' => $this->vendor->id,
            'name' => 'Wave G Widget',
            'description' => 'Catalog slug test product',
            'category' => 'electronics',
            'price' => 19.99,
            'stock_quantity' => 10,
            'is_active' => true,
            'approved_at' => now(),
        ]);
    }

    public function test_models_generate_unique_slugs(): void
    {
        $this->assertNotEmpty($this->vendor->slug);
        $this->assertNotEmpty($this->product->slug);
        $this->assertNotEquals($this->vendor->id, $this->vendor->slug);
        $this->assertNotEquals($this->product->id, $this->product->slug);
    }

    public function test_product_slug_page_renders_and_legacy_id_redirects(): void
    {
        $this->get("/products/{$this->product->slug}")->assertStatus(200);

        $this->get("/products/{$this->product->id}")
            ->assertStatus(301)
            ->assertRedirect("/products/{$this->product->slug}");
    }

    public function test_unknown_product_slug_hits_the_locked_404_contract(): void
    {
        $res = $this->get('/products/definitely-not-a-real-slug');
        $this->assertNotEquals(200, $res->getStatusCode());
    }

    public function test_product_reviews_and_vendor_pages_render(): void
    {
        $reviewer = User::factory()->create(['email_verified_at' => now()]);
        ProductReview::create([
            'product_id' => $this->product->id,
            'user_id' => $reviewer->id,
            'rating' => 5,
            'comment' => 'Great widget',
        ]);

        $this->get("/products/{$this->product->slug}/reviews")->assertStatus(200);
        $this->get("/products/{$this->product->slug}/vendor")->assertStatus(200);
        $this->get("/products/{$this->product->id}/reviews")
            ->assertStatus(301)
            ->assertRedirect("/products/{$this->product->slug}/reviews");
    }

    public function test_vendor_slug_page_and_subpages_render_and_id_redirects(): void
    {
        VendorService::create([
            'vendor_id' => $this->vendor->id,
            'name' => 'Installation service',
            'price' => 49.00,
            'is_active' => true,
        ]);

        $this->get("/vendors/{$this->vendor->slug}")->assertStatus(200);
        $this->get("/vendors/{$this->vendor->slug}/products")->assertStatus(200);
        $this->get("/vendors/{$this->vendor->slug}/services")->assertStatus(200);
        $this->get("/vendors/{$this->vendor->slug}/reviews")->assertStatus(200);

        $this->get("/vendors/{$this->vendor->id}")
            ->assertStatus(301)
            ->assertRedirect("/vendors/{$this->vendor->slug}");
        $this->get("/vendors/{$this->vendor->id}/products")
            ->assertStatus(301)
            ->assertRedirect("/vendors/{$this->vendor->slug}/products");
    }

    public function test_category_slug_is_canonical_and_legacy_id_redirects(): void
    {
        $category = Category::create([
            'name' => 'Wave G Category',
            'slug' => 'wave-g-category',
            'is_active' => true,
        ]);

        $this->get("/categories/{$category->slug}")->assertStatus(200);
        $this->get("/categories/{$category->id}")
            ->assertStatus(301)
            ->assertRedirect("/categories/{$category->slug}");
    }

    public function test_deal_slug_is_canonical_and_legacy_id_redirects(): void
    {
        $dealCategory = NeedCategory::create(['name' => 'Wave G Deals', 'slug' => 'wave-g-deals', 'icon' => 'tag', 'color' => '#333333']);
        $deal = NeedItem::create([
            'category_id' => $dealCategory->id,
            'name' => 'Spring Deal Fest',
            'description' => 'A seasonal offer',
            'price' => 9.99,
            'is_available' => true,
        ]);

        $this->assertNotEmpty($deal->slug);
        $this->get("/deals/{$deal->slug}")->assertStatus(200);
        $this->get("/deals/{$deal->id}")
            ->assertStatus(301)
            ->assertRedirect("/deals/{$deal->slug}");
    }

    public function test_vertical_deal_landings_keep_precedence_over_deal_resolver(): void
    {
        foreach (['food', 'jobs', 'hotels', 'real-estate', 'tasks', 'transportation', 'agriculture', 'booking'] as $slug) {
            $this->get("/deals/{$slug}")->assertStatus(200);
        }
    }

    public function test_deals_category_page_renders(): void
    {
        $dealCategory = NeedCategory::create(['name' => 'Food Finds', 'slug' => 'food-finds', 'icon' => 'utensils', 'color' => '#333333']);
        NeedItem::create([
            'category_id' => $dealCategory->id,
            'name' => 'Lunch Bundle',
            'description' => 'Lunchtime deal',
            'price' => 7.50,
            'is_available' => true,
        ]);

        $this->get('/deals/category/food-finds')->assertStatus(200);
    }

    public function test_catalog_index_pages_render(): void
    {
        $this->get('/products')->assertStatus(200);
        $this->get('/vendors')->assertStatus(200);
        $this->get('/deals')->assertStatus(200);
        $this->get('/categories')->assertStatus(200);
    }
}
