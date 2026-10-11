<?php

namespace Tests\Feature\Seo;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Entities\CmsPage;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * Spec 88: public pages emit title/description/canonical/Open Graph/Twitter
 * metadata and structured data (JSON-LD) server-side, and dynamic CMS pages
 * pick up SEO metadata automatically.
 */
class StructuredDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_homepage_emits_seo_tags_and_website_json_ld(): void
    {
        $res = $this->get('/');

        $res->assertOk();
        $res->assertSee('<meta name="description"', false);
        $res->assertSee('<link rel="canonical"', false);
        $res->assertSee('<meta property="og:title"', false);
        $res->assertSee('<meta property="og:type"', false);
        $res->assertSee('<meta name="twitter:card"', false);
        $res->assertSee('application/ld+json', false);
        $res->assertSee('"@type":"WebSite"', false);
    }

    public function test_product_page_emits_product_json_ld_with_offers(): void
    {
        $vendorUser = $this->createVendorUser();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => 'SEO Store',
            'category' => 'electronics',
            'is_verified' => true,
        ]);
        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'SEO Probe Camera',
            'description' => 'A camera used to verify structured data output.',
            'category' => 'electronics',
            'price' => 19.99,
            'currency' => 'USD',
            'stock_quantity' => 7,
            'is_active' => true,
            'slug' => 'seo-probe-camera',
            'approved_at' => now(),
        ]);

        $res = $this->get('/products/'.$product->slug);

        $res->assertOk();
        $res->assertSee('<meta property="og:title" content="SEO Probe Camera"', false);
        $res->assertSee('rel="canonical" href="'.route('products.show', $product->slug).'"', false);
        $res->assertSee('"@type":"Product"', false);
        $res->assertSee('"@type":"Offer"', false);
        $res->assertSee('"priceCurrency":"USD"', false);
        $res->assertSee('"price":19.99', false);
        $res->assertSee('"@type":"Brand"', false);
        $res->assertSee('SEO Store', false);
        $res->assertSee('InStock', false);
    }

    public function test_dynamic_cms_page_emits_webpage_json_ld_automatically(): void
    {
        CmsPage::create([
            'title' => 'About EverythingNeed',
            'slug' => 'about-seo',
            'description' => 'Who we are.',
            'status' => 'published',
            'visibility' => 'public',
            'seo_title' => 'About Us | EverythingNeed',
            'seo_description' => 'Learn about the EverythingNeed platform.',
            'canonical_url' => null,
            'published_at' => now(),
        ]);

        $res = $this->get('/p/about-seo');

        $res->assertOk();
        $res->assertSee('<meta property="og:title" content="About Us | EverythingNeed"', false);
        $res->assertSee('"@type":"WebPage"', false);
        $res->assertSee('Learn about the EverythingNeed platform.', false);
        $res->assertSee('<meta name="robots" content="index,follow"', false);
    }

    public function test_unlisted_cms_page_is_noindex(): void
    {
        CmsPage::create([
            'title' => 'Hidden Page',
            'slug' => 'hidden-seo',
            'status' => 'published',
            'visibility' => 'unlisted',
        ]);

        $res = $this->get('/p/hidden-seo');

        $res->assertOk();
        $res->assertSee('<meta name="robots" content="noindex,follow"', false);
    }
}
