<?php

namespace Tests\Feature\WaveP;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Wave P — spec 47: content created through the admin console becomes
 * available immediately through listing, detail, search and the API with
 * no developer intervention, and creation is gated by the permission /
 * role system. Also pins the removal of the dead ProductCreated event
 * (search reads the database directly).
 */
class AdminContentCreateTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    public function test_dead_product_created_event_and_listener_are_removed(): void
    {
        // The source files are gone (class_exists() would trip over a stale
        // optimized classmap entry, so assert on the filesystem directly).
        $this->assertFileDoesNotExist(base_path('Modules/Products/Events/ProductCreated.php'));
        $this->assertFileDoesNotExist(base_path('Modules/Products/Listeners/IndexProductForSearch.php'));

        $property = new \ReflectionProperty(\App\Providers\EventServiceProvider::class, 'listen');
        $property->setAccessible(true);
        $listen = $property->getValue(new \App\Providers\EventServiceProvider(app()));
        $this->assertArrayNotHasKey(\Modules\Products\Events\ProductCreated::class, $listen);
    }

    public function test_admin_created_course_is_live_in_listing_detail_and_search(): void
    {
        $this->actingAsAdmin();

        $res = $this->postJson('/api/admin/courses', [
            'title' => 'WaveP Quantum Yak Farming',
            'description' => 'Raising quantum yaks for profit.',
            'category' => 'agriculture',
            'course_type' => 'theory',
            'instructor_name' => 'Dr. Test',
            'price' => 49,
            'duration_hours' => 12,
        ])->assertStatus(201);

        $id = $res->json('data.id');
        $this->assertNotEmpty($id);

        // Listing (spec: listing)
        $listing = $this->getJson('/api/courses?q=' . urlencode('Quantum Yak'))->assertOk();
        $this->assertContains($id, collect($listing->json('data'))->pluck('id')->all());

        // Detail page API
        $this->getJson('/api/courses/' . $id)->assertOk();

        // Unified search with server-computed type + canonical url (spec: search)
        $search = $this->getJson('/api/search?q=' . urlencode('Quantum Yak') . '&type=courses')->assertOk();
        $row = collect($search->json('data.courses'))->firstWhere('id', $id);
        $this->assertNotNull($row, 'Created course missing from unified search.');
        $this->assertSame('course', $row['type']);
        $this->assertSame('/learn/' . $id, $row['url']);

        // Permission system: the creation landed in the audit trail.
        $audit = $this->getJson('/api/admin/audit-logs?action=create&entity_type=course')->assertOk();
        $hit = collect($audit->json('data'))->firstWhere('entity_id', $id);
        $this->assertNotNull($hit, 'Course creation not audited.');
    }

    public function test_course_rejects_unknown_course_type(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/courses', [
            'title' => 'Bad Type Course',
            'description' => 'x',
            'category' => 'misc',
            'course_type' => 'quiz',
            'instructor_name' => 'A',
            'price' => 1,
        ])->assertStatus(422);
    }

    public function test_admin_created_restaurant_is_live_in_listing_and_search(): void
    {
        $this->actingAsAdmin();

        $res = $this->postJson('/api/admin/restaurants', [
            'name' => 'WaveP Neon Kitchen',
            'cuisine_type' => 'Fusion',
            'address' => '1 Test Way',
            'city' => 'Testville',
        ])->assertStatus(201);

        $id = $res->json('data.id');
        $this->assertNotEmpty($id);

        $listing = $this->getJson('/api/restaurants?search=' . urlencode('WaveP Neon'))->assertOk();
        $this->assertContains($id, collect($listing->json('data'))->pluck('id')->all());

        $this->getJson('/api/restaurants/' . $id)->assertOk();

        $search = $this->getJson('/api/search?q=' . urlencode('WaveP Neon') . '&type=restaurants')->assertOk();
        $row = collect($search->json('data.restaurants'))->firstWhere('id', $id);
        $this->assertNotNull($row, 'Created restaurant missing from unified search.');
        $this->assertSame('restaurant', $row['type']);
        $this->assertSame('/food/' . $id, $row['url']);
    }

    public function test_admin_created_hotel_is_live_in_detail_and_search(): void
    {
        $this->actingAsAdmin();

        $res = $this->postJson('/api/admin/hotels', [
            'name' => 'WaveP Test Arms Hotel',
            'address' => '2 Test Way',
            'city' => 'Testville',
            'country' => 'Testland',
            'star_rating' => 4,
        ])->assertStatus(201);

        $id = $res->json('data.id');
        $this->assertNotEmpty($id);

        $this->getJson('/api/hotels/' . $id)->assertOk();

        $search = $this->getJson('/api/search?q=' . urlencode('WaveP Test Arms') . '&type=hotels')->assertOk();
        $row = collect($search->json('data.hotels'))->firstWhere('id', $id);
        $this->assertNotNull($row, 'Created hotel missing from unified search.');
        $this->assertSame('/hotels/' . $id, $row['url']);
    }

    public function test_admin_created_property_is_live_in_detail_and_search(): void
    {
        $this->actingAsAdmin();

        $res = $this->postJson('/api/admin/properties', [
            'title' => 'WaveP Sky Loft',
            'property_type' => 'apartment',
            'price' => 250000,
            'address' => '3 Test Way',
            'city' => 'Testville',
            'country' => 'Testland',
            'bedrooms' => 2,
            'bathrooms' => 1,
        ])->assertStatus(201);

        $id = $res->json('data.id');
        $this->assertNotEmpty($id);

        $this->getJson('/api/properties/' . $id)->assertOk();

        $search = $this->getJson('/api/search?q=' . urlencode('WaveP Sky Loft') . '&type=properties')->assertOk();
        $row = collect($search->json('data.properties'))->firstWhere('id', $id);
        $this->assertNotNull($row, 'Created property missing from unified search.');
        $this->assertSame('property', $row['type']);
        $this->assertSame('/real-estate/' . $id, $row['url']);
    }

    public function test_domain_role_holders_can_create_in_their_domain(): void
    {
        $this->actingAsUser('learning_admin');
        $this->postJson('/api/admin/courses', [
            'title' => 'Learning Admin Course',
            'description' => 'x',
            'category' => 'misc',
            'course_type' => 'practical',
            'instructor_name' => 'A',
            'price' => 10,
        ])->assertStatus(201);
    }

    public function test_plain_user_cannot_use_admin_create_endpoints(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/admin/courses', ['title' => 'x', 'description' => 'x', 'category' => 'x', 'course_type' => 'theory', 'instructor_name' => 'x', 'price' => 1])
            ->assertStatus(403);
        $this->postJson('/api/admin/restaurants', ['name' => 'x', 'cuisine_type' => 'x', 'address' => 'x', 'city' => 'x'])
            ->assertStatus(403);
        $this->postJson('/api/admin/hotels', ['name' => 'x', 'address' => 'x', 'city' => 'x', 'country' => 'x'])
            ->assertStatus(403);
        $this->postJson('/api/admin/properties', ['title' => 'x', 'property_type' => 'house', 'price' => 1, 'address' => 'x', 'city' => 'x', 'country' => 'x'])
            ->assertStatus(403);
    }

    public function test_guest_cannot_use_admin_create_endpoints(): void
    {
        $this->postJson('/api/admin/courses', ['title' => 'x', 'description' => 'x', 'category' => 'x', 'course_type' => 'theory', 'instructor_name' => 'x', 'price' => 1])
            ->assertStatus(401);
        $this->postJson('/api/admin/restaurants', ['name' => 'x', 'cuisine_type' => 'x', 'address' => 'x', 'city' => 'x'])
            ->assertStatus(401);
    }
}
