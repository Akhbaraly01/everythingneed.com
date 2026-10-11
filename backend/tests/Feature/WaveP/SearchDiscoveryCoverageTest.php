<?php

namespace Tests\Feature\WaveP;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Wave P — spec 49: unified discovery returns server-computed type + url on
 * every row (no dead destinations), covers all domains, and rejects unknown
 * types with a 422.
 */
class SearchDiscoveryCoverageTest extends TestCase
{
    private function seedCourseAndProduct(): array
    {
        $courseId = (string) Str::uuid();
        DB::table('courses')->insert([
            'id' => $courseId,
            'title' => 'WaveP Discovery Course',
            'slug' => 'wavep-discovery-' . uniqid(),
            'description' => 'Discovery fixture.',
            'category' => 'misc',
            'price' => 10,
            'course_type' => 'theory',
            'instructor_name' => 'Fixture',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productId = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $productId,
            'vendor_id' => (string) Str::uuid(),
            'name' => 'WaveP Discovery Gizmo',
            'description' => 'Discovery fixture.',
            'category' => 'misc',
            'price' => 5,
            'stock_quantity' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['course_id' => $courseId, 'product_id' => $productId];
    }

    public function test_rows_carry_server_side_type_and_canonical_url(): void
    {
        ['course_id' => $courseId, 'product_id' => $productId] = $this->seedCourseAndProduct();

        $res = $this->getJson('/api/search?q=' . urlencode('WaveP Discovery'))->assertOk();

        $course = collect($res->json('data.courses'))->firstWhere('id', $courseId);
        $this->assertNotNull($course);
        $this->assertSame('course', $course['type']);
        $this->assertSame('/learn/' . $courseId, $course['url']);

        $product = collect($res->json('data.products'))->firstWhere('id', $productId);
        $this->assertNotNull($product);
        $this->assertSame('product', $product['type']);
        $this->assertSame('/products/' . $productId, $product['url']);
    }

    public function test_response_advertises_every_discovery_type(): void
    {
        $this->seedCourseAndProduct();

        $res = $this->getJson('/api/search?q=' . urlencode('WaveP Discovery'))->assertOk();

        $types = $res->json('types');
        $this->assertIsArray($types);
        $this->assertSame(14, count($types), 'Spec 49 discovery type list changed.');
        foreach (['products', 'categories', 'services', 'needs', 'doctors', 'courses', 'experts', 'vendors', 'jobs', 'hotels', 'restaurants', 'properties', 'agriculture', 'building'] as $type) {
            $this->assertContains($type, $types);
        }
    }

    public function test_unknown_type_is_rejected(): void
    {
        $res = $this->getJson('/api/search?q=anything&type=bogus');
        $res->assertStatus(422);
        $this->assertSame('Invalid search type.', $res->json('message'));
    }

    public function test_type_filter_returns_only_that_domain(): void
    {
        $this->seedCourseAndProduct();

        $res = $this->getJson('/api/search?q=' . urlencode('WaveP Discovery') . '&type=properties')->assertOk();
        $this->assertArrayHasKey('properties', $res->json('data'));
        $this->assertArrayNotHasKey('courses', $res->json('data'));
        $this->assertArrayNotHasKey('products', $res->json('data'));
    }
}
