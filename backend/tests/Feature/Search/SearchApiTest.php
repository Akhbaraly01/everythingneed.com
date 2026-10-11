<?php

namespace Tests\Feature\Search;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class SearchApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_requires_min_two_chars(): void
    {
        $this->getJson('/api/search?q=a')->assertStatus(422);
        $this->getJson('/api/search')->assertStatus(422);
    }

    public function test_guest_can_search_products_and_courses(): void
    {
        DB::table('products')->insert([
            'id' => (string) Str::uuid(),
            'vendor_id' => (string) Str::uuid(),
            'name' => 'Guitar Pro Max',
            'description' => 'String instrument',
            'category' => 'music',
            'price' => 199,
            'stock_quantity' => 3,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('courses')->insert([
            'id' => (string) Str::uuid(),
            'title' => 'Guitar 101',
            'slug' => 'guitar-101-'.uniqid(),
            'description' => 'Learn guitar',
            'category' => 'music',
            'price' => 0,
            'course_type' => 'theory',
            'instructor_name' => 'Maestro',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $res = $this->getJson('/api/search?q=Guitar');
        $res->assertOk();
        $this->assertNotEmpty($res->json('data.products'));
        $this->assertNotEmpty($res->json('data.courses'));
    }

    public function test_type_filter_limits_results(): void
    {
        DB::table('courses')->insert([
            'id' => (string) Str::uuid(),
            'title' => 'ZZUniqueCourse',
            'slug' => 'zz-unique-'.uniqid(),
            'description' => 'x',
            'category' => 'misc',
            'price' => 10,
            'course_type' => 'theory',
            'instructor_name' => 'A',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $res = $this->getJson('/api/search?q=ZZUnique&type=courses');
        $res->assertOk();
        $this->assertArrayHasKey('courses', $res->json('data'));
        $this->assertArrayNotHasKey('products', $res->json('data'));
    }

    public function test_inactive_products_excluded(): void
    {
        DB::table('products')->insert([
            'id' => (string) Str::uuid(),
            'vendor_id' => (string) Str::uuid(),
            'name' => 'HiddenGadgetXYZ',
            'description' => '',
            'category' => 'misc',
            'price' => 1,
            'stock_quantity' => 0,
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $res = $this->getJson('/api/search?q=HiddenGadget&type=products');
        $res->assertOk();
        $this->assertEmpty($res->json('data.products'));
    }
}
