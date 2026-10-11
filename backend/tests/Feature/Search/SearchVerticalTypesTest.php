<?php

namespace Tests\Feature\Search;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\Doctor;
use Modules\Hotels\Entities\Hotel;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * W14: unified search across the vertical types.
 *
 * Complements SearchApiTest (products/courses/type scoping/inactive
 * exclusion): every discovery vertical returns real rows with canonical
 * deep links, inactive rows stay out, and unknown types 422.
 */
class SearchVerticalTypesTest extends TestCase
{
    use RefreshDatabase;

    public function test_hotels_searchable_by_city_with_canonical_links(): void
    {
        Hotel::create([
            'name' => 'Osu Night Hotel',
            'address' => '1 Oxford St',
            'city' => 'AccraUnique',
            'country' => 'GH',
            'is_active' => true,
        ]);
        Hotel::create([
            'name' => 'Closed AccraUnique Inn',
            'address' => '2 Closed Rd',
            'city' => 'AccraUnique',
            'country' => 'GH',
            'is_active' => false,
        ]);

        $res = $this->getJson('/api/search?q=AccraUnique&type=hotels')->assertOk();
        $hotels = $res->json('data.hotels');

        $this->assertCount(1, $hotels, 'Inactive hotels stay out of discovery');
        $this->assertSame('hotel', $hotels[0]['type']);
        $this->assertSame('/hotels/'.$hotels[0]['id'], $hotels[0]['url']);
    }

    public function test_restaurants_searchable_by_cuisine(): void
    {
        \Modules\Food\Entities\Restaurant::create([
            'name' => 'Chop Bar House',
            'cuisine_type' => 'GhanaianUnique',
            'address' => '3 Food St',
            'city' => 'Kumasi',
            'is_active' => true,
        ]);

        $res = $this->getJson('/api/search?q=GhanaianUnique&type=restaurants')->assertOk();
        $restaurants = $res->json('data.restaurants');

        $this->assertCount(1, $restaurants);
        $this->assertSame('restaurant', $restaurants[0]['type']);
        $this->assertSame('/food/'.$restaurants[0]['id'], $restaurants[0]['url']);
    }

    public function test_doctors_searchable_by_specialization(): void
    {
        Doctor::create([
            'full_name' => 'Dr. Search Fixture',
            'specialization' => 'DermatologyUnique',
            'qualification' => 'MD',
            'experience_years' => 8,
            'consultation_fee' => 120,
            'is_available' => true,
        ]);

        $res = $this->getJson('/api/search?q=DermatologyUnique&type=doctors')->assertOk();
        $doctors = $res->json('data.doctors');

        $this->assertCount(1, $doctors);
        $this->assertSame('doctor', $doctors[0]['type']);
        $this->assertSame('/healthcare/doctors/'.$doctors[0]['id'], $doctors[0]['url']);
        $this->assertEquals(120, (float) $doctors[0]['price']);
    }

    public function test_needs_and_agriculture_types_return_real_rows(): void
    {
        $user = $this->createUser();
        $request = NeedRequest::create([
            'user_id' => $user->id,
            'request_number' => 'NR-SEARCHFIX',
            'title' => 'Fix leaking tap SinkSearch',
            'description' => 'Fixture request',
            'status' => NeedRequest::STATUS_PUBLISHED,
        ]);

        \DB::table('products')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'vendor_id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Cassava Planter AgriSearch',
            'description' => 'Farm tool',
            'category' => 'agriculture',
            'price' => 45,
            'stock_quantity' => 4,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $needs = $this->getJson('/api/search?q=SinkSearch&type=needs')->assertOk()->json('data.needs');
        $this->assertCount(1, $needs);
        $this->assertSame('need', $needs[0]['type']);
        $this->assertSame('/needs/requests/'.$request->id, $needs[0]['url']);

        $agri = $this->getJson('/api/search?q=AgriSearch&type=agriculture')->assertOk()->json('data.agriculture');
        $this->assertCount(1, $agri);
        $this->assertSame('agriculture', $agri[0]['type']);
        $this->assertSame('/agriculture/products', $agri[0]['url']);
    }

    public function test_unknown_search_type_is_rejected(): void
    {
        $this->getJson('/api/search?q=something&type=nope')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Invalid search type.');
    }
}
