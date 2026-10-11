<?php

namespace Tests\Feature\Products;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * Spec 37: admin product management - the dashboard can create products
 * with the full field set (sku, currency, tax, variants, gallery,
 * specifications, attributes, shipping, featured, discount) and control
 * the publication state (Draft / Published / Hidden / Archived).
 */
class AdminProductManagementTest extends TestCase
{
    use RefreshDatabase;

    /** Chainable admin auth (actingAsAdmin() itself returns the User). */
    private function asAdmin(): static
    {
        $this->actingAsAdmin();

        return $this;
    }

    private function vendor(): Vendor
    {
        return $this->createVendor($this->createUser());
    }

    private function fullPayload(string $vendorId): array
    {
        return [
            'vendor_id' => $vendorId,
            'name' => 'Admin Laptop Pro',
            'slug' => 'admin-laptop-pro',
            'description' => 'Full-spec laptop',
            'category' => 'electronics',
            'subcategory' => 'laptops',
            'sku' => 'LAP-001',
            'price' => 999.99,
            'compare_price' => 1099.99,
            'currency' => 'EUR',
            'tax_rate' => 7.5,
            'discount_percent' => 10,
            'featured' => true,
            'publication_state' => 'published',
            'specifications' => ['ram' => '16GB', 'storage' => '512GB SSD'],
            'attributes' => ['color' => 'Space Grey'],
            'shipping' => ['weight_kg' => 1.8, 'free_shipping' => true],
            'image_url' => 'https://cdn.example.com/laptop.jpg',
            'images' => ['https://cdn.example.com/laptop-1.jpg', 'https://cdn.example.com/laptop-2.jpg'],
            'stock_quantity' => 25,
            'variants' => [
                ['name' => '16GB / 512GB', 'sku' => 'LAP-001-16', 'price' => 999.99, 'stock_quantity' => 15],
                ['name' => '32GB / 1TB', 'sku' => 'LAP-001-32', 'price' => 1299.99, 'stock_quantity' => 10],
            ],
        ];
    }

    public function test_admin_creates_product_with_full_spec_37_field_set(): void
    {
        $vendor = $this->vendor();

        $response = $this->asAdmin()->postJson('/api/products', $this->fullPayload($vendor->id));

        $response->assertStatus(201);

        $id = $response->json('data.id');
        $product = Product::find($id);

        $this->assertSame('LAP-001', $product->sku);
        $this->assertSame('EUR', $product->currency);
        $this->assertEquals(7.5, (float) $product->tax_rate);
        $this->assertEquals(10.0, (float) $product->discount_percent);
        $this->assertTrue($product->featured);
        $this->assertSame('published', $product->publication_state);
        $this->assertTrue($product->is_active);
        $this->assertSame('admin-laptop-pro', $product->slug);
        $this->assertSame(['ram' => '16GB', 'storage' => '512GB SSD'], $product->specifications);
        $this->assertSame(['color' => 'Space Grey'], $product->attributes);
        $this->assertTrue($product->shipping['free_shipping']);
        $this->assertCount(2, $product->images);
        $this->assertCount(2, $product->variants);

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $id,
            'sku' => 'LAP-001-16',
            'price' => 999.99,
        ]);
    }

    public function test_invalid_publication_state_is_rejected(): void
    {
        $vendor = $this->vendor();

        $payload = $this->fullPayload($vendor->id);
        $payload['publication_state'] = 'zapped';

        $this->asAdmin()
            ->postJson('/api/products', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['publication_state']);
    }

    public function test_duplicate_slug_is_rejected(): void
    {
        $vendor = $this->vendor();

        $this->asAdmin()->postJson('/api/products', $this->fullPayload($vendor->id))->assertStatus(201);

        $second = $this->fullPayload($vendor->id);
        $second['name'] = 'Another Laptop';

        $this->asAdmin()
            ->postJson('/api/products', $second)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_draft_state_keeps_product_off_the_marketplace_until_published(): void
    {
        $vendor = $this->vendor();
        $payload = $this->fullPayload($vendor->id);
        $payload['publication_state'] = 'draft';

        $id = $this->asAdmin()->postJson('/api/products', $payload)->assertStatus(201)->json('data.id');
        $product = Product::find($id);
        $this->assertSame('draft', $product->publication_state);
        $this->assertFalse($product->is_active);

        $this->asAdmin()->putJson("/api/products/{$id}", ['publication_state' => 'published'])
            ->assertOk();

        $product->refresh();
        $this->assertSame('published', $product->publication_state);
        $this->assertTrue($product->is_active);
    }

    public function test_vendor_submission_enters_draft_and_approval_promotes_to_published(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);

        $id = $this->actingAs($vendorUser, 'sanctum')
            ->postJson('/api/products', [
                'vendor_id' => $vendor->id,
                'name' => 'Vendor Chair',
                'category' => 'furniture',
                'price' => 49,
                'stock_quantity' => 3,
            ])
            ->assertStatus(201)
            ->json('data.id');

        $this->assertSame('draft', Product::find($id)->publication_state);
        $this->assertFalse(Product::find($id)->is_active);

        $this->asAdmin()->postJson("/api/admin/products/{$id}/approve")->assertOk();
        $this->assertSame('published', Product::find($id)->publication_state);

        $other = $this->createVendor($this->createUser());
        $rejectedId = $this->asAdmin()->postJson('/api/products', [
            'vendor_id' => $other->id,
            'name' => 'Rejected Item',
            'category' => 'furniture',
            'price' => 10,
            'stock_quantity' => 1,
        ])->json('data.id');

        $this->asAdmin()->postJson("/api/admin/products/{$rejectedId}/reject", ['reason' => 'low quality'])->assertOk();
        $this->assertSame('hidden', Product::find($rejectedId)->publication_state);
        $this->assertFalse(Product::find($rejectedId)->is_active);
    }

    public function test_archiving_marks_publication_state_archived(): void
    {
        $vendor = $this->vendor();
        $id = $this->asAdmin()->postJson('/api/products', $this->fullPayload($vendor->id))
            ->assertStatus(201)
            ->json('data.id');

        $this->asAdmin()->deleteJson("/api/products/{$id}")->assertOk();

        $product = Product::find($id);
        $this->assertSame('archived', $product->publication_state);
        $this->assertFalse($product->is_active);
    }

    public function test_variant_update_requires_price(): void
    {
        $vendor = $this->vendor();
        $id = $this->asAdmin()->postJson('/api/products', $this->fullPayload($vendor->id))
            ->json('data.id');

        $this->asAdmin()
            ->putJson("/api/products/{$id}", [
                'variants' => [['name' => 'Broken']],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['variants.0.price']);
    }

    public function test_update_replaces_variant_set(): void
    {
        $vendor = $this->vendor();
        $id = $this->asAdmin()->postJson('/api/products', $this->fullPayload($vendor->id))
            ->json('data.id');

        $this->asAdmin()->putJson("/api/products/{$id}", [
            'variants' => [
                ['name' => 'Only One', 'price' => 899.99, 'stock_quantity' => 5],
            ],
        ])->assertOk();

        $variants = Product::find($id)->variants;
        $this->assertCount(1, $variants);
        $this->assertSame('Only One', $variants->first()->name);
    }
}
