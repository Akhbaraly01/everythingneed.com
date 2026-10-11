<?php

namespace Tests\Feature\WaveN;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\BuildingServices\Entities\BuildingServiceBooking;
use Modules\BuildingServices\Entities\ServiceWorker;
use Modules\Food\Entities\FoodOrder;
use Modules\Food\Entities\MenuItem;
use Modules\Food\Entities\Restaurant;
use Modules\Hotels\Entities\Hotel;
use Modules\Jobs\Entities\JobApplication;
use Modules\Jobs\Entities\JobPost;
use Modules\RealEstate\Entities\Property;
use Modules\Rides\Entities\Driver;
use Modules\Rides\Entities\Ride;
use Tests\TestCase;

class WaveNVerticalsTest extends TestCase
{
    use RefreshDatabase;

    // ---- Rides (§55) ----

    public function test_available_drivers_report_no_fake_fares(): void
    {
        $driver = Driver::create([
            'user_id' => $this->createUser()->id,
            'full_name' => 'Dan Driver',
            'phone' => '0800000001',
            'license_number' => 'LIC-1',
            'vehicle_type' => 'sedan',
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->createUser(), 'sanctum')
            ->getJson('/api/rides/available')->assertOk();

        $row = collect($response->json('data'))->firstWhere('id', $driver->id);
        $this->assertNotNull($row);
        $this->assertArrayNotHasKey('estimated_fare', $row);
        $this->assertArrayNotHasKey('estimated_time', $row);
        $this->assertNull($row['fare_quote']);
    }

    public function test_driver_registration_and_ride_lifecycle(): void
    {
        $rider = $this->createUser();
        $driverUser = $this->createUser();

        // Registration is one profile per user.
        $this->actingAs($driverUser, 'sanctum')->postJson('/api/drivers', [
            'full_name' => 'Dee Driver',
            'phone' => '0800000002',
            'license_number' => 'LIC-2',
            'vehicle_type' => 'suv',
        ])->assertStatus(201);
        $this->actingAs($driverUser, 'sanctum')->postJson('/api/drivers', [
            'full_name' => 'Dee Driver',
            'phone' => '0800000002',
            'license_number' => 'LIC-2',
            'vehicle_type' => 'suv',
        ])->assertStatus(409);

        $ride = $this->actingAs($rider, 'sanctum')->postJson('/api/rides/request', [
            'pickup_address' => 'A', 'pickup_lat' => 1, 'pickup_lng' => 1,
            'dropoff_address' => 'B', 'dropoff_lat' => 2, 'dropoff_lng' => 2,
            'ride_type' => 'economy',
        ])->assertStatus(201)->json('data.id');

        // Strangers cannot accept; non-drivers cannot accept.
        $this->actingAs($this->createUser(), 'sanctum')
            ->postJson("/api/rides/{$ride}/accept")->assertStatus(403);

        $this->actingAs($driverUser, 'sanctum')->postJson("/api/rides/{$ride}/accept")
            ->assertOk()->assertJsonPath('data.status', 'accepted');

        // Second accept is gone.
        $otherDriver = $this->createUser();
        Driver::create([
            'user_id' => $otherDriver->id, 'full_name' => 'Other', 'phone' => '1',
            'license_number' => 'L-9', 'vehicle_type' => 'sedan', 'is_available' => true,
        ]);
        $this->actingAs($otherDriver, 'sanctum')->postJson("/api/rides/{$ride}/accept")
            ->assertStatus(409);

        // Driver completes with a confirmed fare; rider cannot complete.
        $this->actingAs($rider, 'sanctum')->postJson("/api/rides/{$ride}/complete", [
            'fare' => 25,
        ])->assertStatus(403);
        $this->actingAs($driverUser, 'sanctum')->postJson("/api/rides/{$ride}/complete", [
            'fare' => 25, 'distance_km' => 8.5, 'duration_minutes' => 20,
        ])->assertOk()->assertJsonPath('data.status', 'completed');

        $this->assertEqualsWithDelta(25.0, (float) Ride::find($ride)->fare, 0.01);
        $this->assertSame(1, (int) Driver::where('user_id', $driverUser->id)->value('total_rides'));

        // Completed rides cannot be cancelled.
        $this->actingAs($rider, 'sanctum')->postJson("/api/rides/{$ride}/cancel")
            ->assertStatus(422);
    }

    // ---- Food (§56) ----

    private function makeRestaurantWithMenu(): array
    {
        $restaurant = Restaurant::create([
            'name' => 'Wave N Kitchen', 'cuisine_type' => 'local',
            'address' => '1 Food St', 'city' => 'Lagos',
        ]);
        $item = MenuItem::create([
            'restaurant_id' => $restaurant->id, 'name' => 'Jollof',
            'price' => 30, 'category' => 'mains', 'is_available' => true,
        ]);
        $off = MenuItem::create([
            'restaurant_id' => $restaurant->id, 'name' => 'Sold Out Stew',
            'price' => 10, 'category' => 'mains', 'is_available' => false,
        ]);

        return [$restaurant, $item, $off];
    }

    public function test_restaurant_order_endpoint_places_real_orders_with_items(): void
    {
        $user = $this->createUser();
        [$restaurant, $item] = $this->makeRestaurantWithMenu();

        $response = $this->actingAs($user, 'sanctum')->postJson(
            "/api/restaurants/{$restaurant->id}/order",
            [
                'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
                'delivery_address' => 'Home',
            ]
        )->assertStatus(201);

        $order = FoodOrder::findOrFail($response->json('data.id'));
        $this->assertEqualsWithDelta(60.0, (float) $order->total_amount, 0.01);
        $this->assertCount(1, $order->items);
        $this->assertSame($item->id, $order->items->first()->menu_item_id);
    }

    public function test_food_orders_validate_ownership_and_availability(): void
    {
        $user = $this->createUser();
        [$restaurant, $item, $off] = $this->makeRestaurantWithMenu();
        $other = Restaurant::create([
            'name' => 'Other Kitchen', 'cuisine_type' => 'x',
            'address' => '2 Food St', 'city' => 'Lagos',
        ]);

        // Item from another restaurant.
        $this->actingAs($user, 'sanctum')->postJson('/api/food/orders', [
            'restaurant_id' => $other->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
            'delivery_address' => 'Home',
        ])->assertStatus(422);
        $this->assertSame(0, FoodOrder::count());

        // Unavailable item.
        $this->actingAs($user, 'sanctum')->postJson('/api/food/orders', [
            'restaurant_id' => $restaurant->id,
            'items' => [['menu_item_id' => $off->id, 'quantity' => 1]],
            'delivery_address' => 'Home',
        ])->assertStatus(422);
        $this->assertSame(0, FoodOrder::count());

        // Unknown item.
        $this->actingAs($user, 'sanctum')->postJson('/api/food/orders', [
            'restaurant_id' => $restaurant->id,
            'items' => [['menu_item_id' => '00000000-0000-0000-0000-000000000000', 'quantity' => 1]],
            'delivery_address' => 'Home',
        ])->assertStatus(404);
    }

    // ---- Real estate (§58) ----

    public function test_property_create_persists_real_columns_and_my_listings_scopes(): void
    {
        $user = $this->createUser();
        $other = $this->createUser();

        // Guest gates first: actingAs persists for the rest of the test.
        // The index is public; create + my-listings require auth.
        $this->get('/real-estate')->assertOk();
        foreach (['/real-estate/create', '/real-estate/my-listings'] as $path) {
            $this->get($path)->assertRedirect(route('login'));
        }

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/properties', [
            'title' => 'Wave N Duplex',
            'description' => 'Nice place',
            'listing_type' => 'rent',
            'property_type' => 'house',
            'price' => 500000,
            'address' => '3 Estate Rd',
            'city' => 'Lagos',
            'country' => 'NG',
            'bedrooms' => 4,
            'area_sqft' => 2500,
        ])->assertStatus(201);

        $property = Property::findOrFail($response->json('data.id'));
        $this->assertSame($user->id, $property->user_id);
        $this->assertSame('rent', $property->listing_type);
        $this->assertEqualsWithDelta(2500, (float) $property->area_sqft, 0.01);

        $mine = $this->actingAs($user, 'sanctum')->getJson('/api/properties/my-listings')->assertOk();
        $this->assertSame(1, $mine->json('meta.total'));

        $theirs = $this->actingAs($other, 'sanctum')->getJson('/api/properties/my-listings')->assertOk();
        $this->assertSame(0, $theirs->json('meta.total'));

        // Spec aliases render.
        $this->actingAs($user, 'web')->get('/real-estate')->assertOk();
        $this->actingAs($user, 'web')->get("/real-estate/{$property->id}")->assertOk();
        $this->actingAs($user, 'web')->get('/real-estate/my-listings')->assertOk();
    }

    // ---- Building services (§59) ----

    public function test_building_booking_assigns_a_real_available_worker(): void
    {
        $customer = $this->createUser();
        $workerUser = $this->createUser();
        $worker = ServiceWorker::create([
            'user_id' => $workerUser->id, 'full_name' => 'Willy Worker',
            'phone' => '0800000003', 'worker_type' => 'plumber', 'is_available' => true,
        ]);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/building-services/book', [
            'worker_type' => 'plumber',
            'scheduled_date' => '2030-07-01',
            'scheduled_time' => '09:00',
            'address' => '4 Fix St',
        ])->assertStatus(201);

        $this->assertTrue((bool) $response->json('data.worker_assigned'));
        $booking = BuildingServiceBooking::findOrFail($response->json('data.id'));
        $this->assertSame($worker->id, $booking->worker_id);

        // The relation resolves instead of throwing on a missing column.
        $this->assertSame('Willy Worker', $booking->worker->full_name);
    }

    public function test_building_assignment_guards_and_lifecycle(): void
    {
        $customer = $this->createUser();
        $stranger = $this->createUser();
        $workerUser = $this->createUser();
        $busy = ServiceWorker::create([
            'user_id' => $workerUser->id, 'full_name' => 'Busy Bee',
            'phone' => '1', 'worker_type' => 'electrician', 'is_available' => false,
        ]);

        $bookingId = $this->actingAs($customer, 'sanctum')->postJson('/api/building-services/book', [
            'worker_type' => 'electrician',
            'scheduled_date' => '2030-07-02',
            'address' => '5 Fix St',
        ])->assertStatus(201)->json('data.id');

        // Unassigned (no available worker), strangers forbidden.
        $this->assertNull(BuildingServiceBooking::find($bookingId)->worker_id);
        $this->actingAs($stranger, 'sanctum')->postJson(
            "/api/building-services/bookings/{$bookingId}/assign",
            ['worker_id' => $busy->id]
        )->assertStatus(403);

        // Unavailable worker rejected even by the owner.
        $this->actingAs($customer, 'sanctum')->postJson(
            "/api/building-services/bookings/{$bookingId}/assign",
            ['worker_id' => $busy->id]
        )->assertStatus(422);

        // Flip available, assign with a quote, complete, then double-complete 422s.
        $busy->update(['is_available' => true]);
        $this->actingAs($customer, 'sanctum')->postJson(
            "/api/building-services/bookings/{$bookingId}/assign",
            ['worker_id' => $busy->id, 'quoted_price' => 150]
        )->assertOk()->assertJsonPath('data.worker_id', $busy->id);

        $this->actingAs($workerUser, 'sanctum')->postJson(
            "/api/building-services/bookings/{$bookingId}/transition",
            ['status' => 'completed']
        )->assertOk()->assertJsonPath('data.status', 'completed');

        $this->assertEqualsWithDelta(150, (float) BuildingServiceBooking::find($bookingId)->quoted_price, 0.01);

        $this->actingAs($customer, 'sanctum')->postJson(
            "/api/building-services/bookings/{$bookingId}/transition",
            ['status' => 'cancelled']
        )->assertStatus(422);
    }

    // ---- Jobs (§53) ----

    private function makeJob(User $owner): JobPost
    {
        return JobPost::create([
            'user_id' => $owner->id,
            'title' => 'Wave N Engineer',
            'description' => 'Build things',
            'company' => 'WaveCo',
            'location' => 'Lagos',
            'job_type' => 'full_time',
        ]);
    }

    public function test_job_application_pipeline_and_profile(): void
    {
        $owner = $this->createUser();
        $applicant = $this->createUser();
        $stranger = $this->createUser();
        $job = $this->makeJob($owner);

        $applicationId = $this->actingAs($applicant, 'sanctum')
            ->postJson("/api/jobs/{$job->id}/apply", ['cover_letter' => 'Hire me'])
            ->assertStatus(201)->json('data.id');

        // Visibility: applicant + owner yes, stranger no.
        $this->actingAs($applicant, 'sanctum')->getJson("/api/jobs/applications/{$applicationId}")->assertOk();
        $this->actingAs($owner, 'sanctum')->getJson("/api/jobs/applications/{$applicationId}")->assertOk();
        $this->actingAs($stranger, 'sanctum')->getJson("/api/jobs/applications/{$applicationId}")->assertStatus(403);

        // Only the owner moves the pipeline; bad values 422.
        $this->actingAs($applicant, 'sanctum')->patchJson("/api/jobs/applications/{$applicationId}", [
            'status' => 'hired',
        ])->assertStatus(403);
        $this->actingAs($owner, 'sanctum')->patchJson("/api/jobs/applications/{$applicationId}", [
            'status' => 'ceo',
        ])->assertStatus(422);
        $this->actingAs($owner, 'sanctum')->patchJson("/api/jobs/applications/{$applicationId}", [
            'status' => 'shortlisted',
        ])->assertOk()->assertJsonPath('data.status', 'shortlisted');

        $this->assertSame('shortlisted', JobApplication::find($applicationId)->status);

        // Employer profile aggregates.
        $this->actingAs($owner, 'sanctum')->getJson('/api/jobs/profile')
            ->assertOk()
            ->assertJsonPath('data.total_posts', 1)
            ->assertJsonPath('data.applications_received', 1);

        // Admin sees the application.
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/job-applications')
            ->assertOk()
            ->assertJsonFragment(['id' => $applicationId]);
    }

    public function test_jobs_spec_pages_render(): void
    {
        $user = $this->createUser();
        $job = $this->makeJob($user);
        $applicationId = JobApplication::create([
            'job_post_id' => $job->id, 'user_id' => $user->id, 'status' => 'pending',
        ])->id;

        $paths = ['/jobs/create', '/jobs/my-jobs', '/jobs/profile', "/jobs/applications/{$applicationId}"];
        foreach ($paths as $path) {
            $this->get($path)->assertRedirect(route('login'));
        }
        foreach ($paths as $path) {
            $this->actingAs($user, 'web')->get($path)->assertOk();
        }
        $this->get('/jobs/search')->assertOk();
    }

    // ---- Hotels (§54) ----

    public function test_hotel_booking_aliases_and_reviews(): void
    {
        $user = $this->createUser();

        // Guest gates first: actingAs persists for the rest of the test.
        $this->get('/hotels/bookings')->assertRedirect(route('login'));
        $this->get('/hotels/bookings/anything')->assertRedirect(route('login'));

        $hotel = Hotel::create([
            'name' => 'Wave N Hotel', 'address' => '6 Stay Rd',
            'city' => 'Lagos', 'country' => 'NG',
        ]);

        // Reviews flow through the generic endpoint.
        $this->actingAs($user, 'sanctum')->postJson('/api/reviews', [
            'reviewable_type' => 'hotel',
            'reviewable_id' => $hotel->id,
            'rating' => 5,
            'comment' => 'Great stay',
        ])->assertStatus(201);

        $list = $this->actingAs($user, 'sanctum')
            ->getJson("/api/reviews?reviewable_type=hotel&reviewable_id={$hotel->id}")
            ->assertOk();
        $this->assertSame(1, count($list->json('data')));

        // Booking alias pages render behind auth.
        $this->actingAs($user, 'web')->get('/hotels/bookings')->assertOk();
        $this->actingAs($user, 'web')->get('/hotels/bookings/anything')->assertOk();
    }

    // ---- Experts (§60) ----

    public function test_expert_categories_and_filters(): void
    {
        \Modules\Healthcare\Entities\Doctor::create([
            'full_name' => 'Dr. Category Seed',
            'specialization' => 'Neurology',
            'qualification' => 'MBBS',
            'consultation_fee' => 60,
            'is_available' => true,
        ]);

        $this->getJson('/api/experts/categories')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Neurology']);

        // Filters compose without breaking the pinned shape.
        $this->getJson('/api/experts?qualification=MBBS&experience_min=5')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    // ---- Agriculture (§57) ----

    public function test_agriculture_farmers_page_renders(): void
    {
        $this->get('/agriculture/farmers')->assertOk();
        $this->get('/agriculture/products')->assertOk();
    }
}
