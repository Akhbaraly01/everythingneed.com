<?php

namespace Tests\Unit\Seed;

use Database\Seeders\Support\PlaceholderArt;
use PHPUnit\Framework\TestCase;

/**
 * L-H-1: seed artwork must represent the product it stands in for, so the
 * classifier that maps product names/categories to glyphs is pinned here.
 */
class PlaceholderArtTest extends TestCase
{
    public function test_clothing_names_resolve_to_clothing_glyphs(): void
    {
        $this->assertSame('shirt', PlaceholderArt::productGlyph('Classic Cotton T-Shirt', 'clothing'));
        $this->assertSame('shirt', PlaceholderArt::productGlyph('Striped Polo Shirt', 'clothing'));
        $this->assertSame('pants', PlaceholderArt::productGlyph('Slim-Fit Denim Jeans', 'clothing'));
        $this->assertSame('pants', PlaceholderArt::productGlyph('Chino Trousers', 'clothing'));
        $this->assertSame('dress', PlaceholderArt::productGlyph('Summer Floral Dress', 'clothing'));
        $this->assertSame('shoe', PlaceholderArt::productGlyph('Running Sneakers', 'clothing'));
        $this->assertSame('shoe', PlaceholderArt::productGlyph('Leather Ankle Boots', 'clothing'));
    }

    public function test_electronics_names_resolve_to_device_glyphs(): void
    {
        $this->assertSame('headphones', PlaceholderArt::productGlyph('Wireless Bluetooth Headphones', 'electronics'));
        $this->assertSame('phone', PlaceholderArt::productGlyph('Smartphone 128GB', 'electronics'));
        $this->assertSame('laptop', PlaceholderArt::productGlyph('Ultrabook Laptop 14-inch', 'electronics'));
        $this->assertSame('watch', PlaceholderArt::productGlyph('Smart Fitness Watch', 'electronics'));
        $this->assertSame('camera', PlaceholderArt::productGlyph('4K Action Camera', 'electronics'));
        $this->assertSame('tv', PlaceholderArt::productGlyph('55-inch Smart TV', 'electronics'));
    }

    public function test_other_verticals_resolve_to_their_glyphs(): void
    {
        $this->assertSame('plant', PlaceholderArt::productGlyph('Hybrid Maize Seeds (5kg)', 'agriculture'));
        $this->assertSame('plant', PlaceholderArt::productGlyph('Organic Compost (50kg bag)', 'agriculture'));
        $this->assertSame('bottle', PlaceholderArt::productGlyph('Moisturising Body Lotion', 'beauty'));
        $this->assertSame('sofa', PlaceholderArt::productGlyph('Storage Cabinet Shelf', 'home'));
        $this->assertSame('pot', PlaceholderArt::productGlyph('Stainless Steel Kettle', 'home'));
    }

    public function test_category_fallback_applies_when_name_has_no_keyword(): void
    {
        $this->assertSame('shirt', PlaceholderArt::productGlyph('Lorem ipsum dolor', 'clothing'));
        $this->assertSame('phone', PlaceholderArt::productGlyph('Lorem ipsum dolor', 'electronics'));
        $this->assertSame('bottle', PlaceholderArt::productGlyph('Lorem ipsum dolor', 'beauty'));
        $this->assertSame('box', PlaceholderArt::productGlyph('Lorem ipsum dolor', 'miscellaneous'));
    }

    public function test_render_returns_png_bytes_when_gd_is_available(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension not available.');
        }

        $bytes = PlaceholderArt::render('seed-id', 'Classic Cotton T-Shirt', 'clothing', 'shirt');

        $this->assertNotNull($bytes);
        // PNG magic number.
        $this->assertSame("\x89PNG", substr((string) $bytes, 0, 4));
    }

    public function test_render_product_returns_deterministic_studio_png(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension not available.');
        }

        $shirt = PlaceholderArt::renderProduct('42', 'Classic Cotton T-Shirt', 'clothing');
        $shirtAgain = PlaceholderArt::renderProduct('42', 'Classic Cotton T-Shirt', 'clothing');
        $laptop = PlaceholderArt::renderProduct('42', 'Ultrabook Laptop 14-inch', 'electronics');

        $this->assertNotNull($shirt);
        $this->assertSame("\x89PNG", substr((string) $shirt, 0, 4));
        // Same seed + class => identical bytes; different glyph => different art.
        $this->assertSame($shirt, $shirtAgain);
        $this->assertNotSame($shirt, $laptop);
    }
}
