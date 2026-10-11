<?php

namespace Tests\Feature\WaveD;

use App\Models\User;
use App\Models\UserRole;
use Core\Services\Contracts\PublicNavigationInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\BuildingServices\Entities\ServiceWorker;
use Modules\Food\Entities\Restaurant;
use Modules\Hotels\Entities\Hotel;
use Modules\Jobs\Entities\JobPost;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Modules\Needs\Entities\TaskPost;
use Modules\Products\Entities\Product;
use Modules\RealEstate\Entities\Property;
use Modules\Rides\Entities\Flight;
use Tests\TestCase;

/**
 * Wave D - Home page (spec S8): `/` renders Home for guests and marketplace
 * customers while console roles keep their landing, and the 26-section IA
 * is served from real rows only (sections are complete but empty when the
 * database has no data - never fabricated).
 */
class WaveDHomeSectionsTest extends TestCase
{
    use RefreshDatabase;

    private const SECTION_KEYS = [
        'dailyDeals',
        'featured',
        'deals',
        'services',
        'jobs',
        'hotels',
        'transportation',
        'food',
        'agriculture',
        'realEstate',
        'buildingServices',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
        app(PublicNavigationInterface::class)->flush();
    }

    // ── Route behaviour ─────────────────────────────────────────────────────

    public function test_guest_root_renders_home(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Home/Index'));
    }

    public function test_marketplace_customer_root_renders_home(): void
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => 'user']);

        $this->actingAs($user, 'web')
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Home/Index'));
    }

    public function test_console_roles_keep_their_role_landing(): void
    {
        $admin = User::factory()->create();
        UserRole::create(['user_id' => $admin->id, 'role' => 'super_admin']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($admin, 'web')->get('/')->assertRedirect('/admin/dashboard');

        $worker = User::factory()->create();
        UserRole::create(['user_id' => $worker->id, 'role' => 'worker']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($worker, 'web')->get('/')->assertRedirect('/provider');
    }

    public function test_dashboard_renders_with_the_same_sections_payload(): void
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => 'user']);

        $this->actingAs($user, 'web')
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('sections'));
    }

    // ── Empty state: complete but never fabricated ──────────────────────────

    public function test_sections_payload_is_complete_and_empty_on_a_fresh_database(): void
    {
        $this->get('/')->assertOk()->assertInertia(function (Assert $page) {
            $page->component('Home/Index');
            foreach (self::SECTION_KEYS as $key) {
                $page->has("sections.{$key}", 0);
            }
        });
    }

    public function test_promo_copy_comes_from_editable_ui_texts(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Home/Index')
            ->where('uiTexts.ui.home_bonus_title.value', 'New here?')
            ->where('uiTexts.ui.home_learn_cta.value', 'Explore courses')
            ->where('uiTexts.ui.home_need_cta.value', 'Submit your need'));
    }

    // ── Real data: one row per vertical surfaces with a real link ───────────

    public function test_every_vertical_section_surfaces_real_rows_with_real_links(): void
    {
        $vendor = $this->createVendor($this->createUser());

        $dealProduct = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Discounted Headphones',
            'price' => 10,
            'compare_price' => 20,
            'category' => 'electronics',
            'rating' => 4.2,
        ]);
        $featuredProduct = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Top Rated Laptop',
            'price' => 900,
            'compare_price' => null,
            'category' => 'electronics',
            'rating' => 4.9,
        ]);
        $agriProduct = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Drip Irrigation Kit',
            'price' => 75,
            'compare_price' => null,
            'category' => 'agriculture',
            'rating' => 4.0,
        ]);
        // Excluded everywhere: inactive products never surface.
        Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Retired Listing',
            'is_active' => false,
            'rating' => 5.0,
        ]);

        $needCategory = NeedCategory::create([
            'name' => 'Electronics',
            'slug' => 'electronics-' . uniqid(),
            'icon' => 'zap',
            'color' => '#F59E0B',
        ]);
        $deal = NeedItem::create([
            'category_id' => $needCategory->id,
            'name' => 'Used Camera Bundle',
            'description' => 'Camera, lenses and bag in great condition.',
            'price' => 320,
            'is_available' => true,
        ]);
        NeedItem::create([
            'category_id' => $needCategory->id,
            'name' => 'Unavailable Deal',
            'price' => 10,
            'is_available' => false,
        ]);

        $owner = User::factory()->create();

        $openTask = TaskPost::create([
            'created_by' => $owner->id,
            'post_number' => 'TK-WAVE-D',
            'title' => 'Assemble office furniture',
            'description' => 'Six desks and twelve chairs.',
            'budget' => 90,
            'status' => TaskPost::STATUS_OPEN,
        ]);
        TaskPost::create([
            'created_by' => $owner->id,
            'post_number' => 'TK-CLOSED',
            'title' => 'Closed task',
            'description' => 'Already taken.',
            'budget' => 20,
            'status' => 'assigned',
        ]);

        $job = JobPost::create([
            'user_id' => $owner->id,
            'title' => 'Frontend Engineer',
            'description' => 'Build delightful UIs.',
            'company' => 'Acme Labs',
            'location' => 'Accra',
            'job_type' => 'full_time',
            'is_active' => true,
        ]);

        $hotel = Hotel::create([
            'name' => 'Wave D Suites',
            'address' => '1 Test Ave',
            'city' => 'Accra',
            'state' => 'GA',
            'country' => 'GH',
            'star_rating' => 4,
            'description' => 'Riverside suites.',
            'is_active' => true,
        ]);

        $flight = Flight::create([
            'flight_number' => 'EN-WAVED',
            'airline' => 'EverythingAir',
            'origin_city' => 'Accra',
            'origin_code' => 'ACC',
            'destination_city' => 'London',
            'destination_code' => 'LHR',
            'departure_time' => '09:30',
            'arrival_time' => '14:45',
            'duration_minutes' => 375,
            'price' => 420.0,
            'seats_available' => 30,
            'days_of_week' => [1, 3, 5],
        ]);

        $restaurant = Restaurant::create([
            'name' => 'Wave D Kitchen',
            'cuisine_type' => 'ghanaian',
            'address' => '1 Food St',
            'city' => 'Accra',
            'rating' => 4.5,
            'is_active' => true,
        ]);

        $property = Property::create([
            'user_id' => $owner->id,
            'title' => 'Wave D Loft',
            'description' => 'Central loft.',
            'property_type' => 'apartment',
            'price' => 250000,
            'currency' => 'USD',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'address' => '1 Main St',
            'city' => 'Lisbon',
            'country' => 'PT',
            'is_active' => true,
        ]);

        $worker = ServiceWorker::create([
            'user_id' => $owner->id,
            'full_name' => 'Kofi Builder',
            'phone' => '+15551234567',
            'worker_type' => 'electrician',
            'hourly_rate' => 45,
            'rating' => 4.7,
            'is_available' => true,
        ]);

        $this->get('/')->assertOk()->assertInertia(function (Assert $page) use (
            $dealProduct, $featuredProduct, $agriProduct, $deal, $openTask,
            $job, $hotel, $flight, $restaurant, $property, $worker
        ) {
            $page->component('Home/Index')
                ->has('sections.dailyDeals', 1)
                ->where('sections.dailyDeals.0.url', "/products/{$dealProduct->id}")
                ->has('sections.featured', 3)
                ->where('sections.featured.0.title', 'Top Rated Laptop')
                ->has('sections.deals', 1)
                ->where('sections.deals.0.url', "/deals/{$deal->id}")
                ->has('sections.services', 1)
                ->where('sections.services.0.url', "/tasks/{$openTask->id}")
                ->has('sections.jobs', 1)
                ->where('sections.jobs.0.url', "/jobs/{$job->id}")
                ->has('sections.hotels', 1)
                ->where('sections.hotels.0.url', "/hotels/{$hotel->id}")
                ->has('sections.transportation', 1)
                ->where('sections.transportation.0.url', "/flights/{$flight->id}")
                ->has('sections.food', 1)
                ->where('sections.food.0.url', "/food/{$restaurant->id}")
                ->has('sections.agriculture', 1)
                ->where('sections.agriculture.0.url', "/products/{$agriProduct->id}")
                ->has('sections.realEstate', 1)
                ->where('sections.realEstate.0.url', "/properties/{$property->id}")
                ->has('sections.buildingServices', 1)
                ->where('sections.buildingServices.0.url', "/building-services/workers/{$worker->id}")
                ->has('products.data', 3);
        });
    }

    public function test_daily_deals_only_include_products_actually_discounted(): void
    {
        $vendor = $this->createVendor($this->createUser());

        Product::factory()->create(['vendor_id' => $vendor->id, 'price' => 10, 'compare_price' => 20, 'category' => 'electronics']);
        // compare_price <= price is not a deal; null is not a deal.
        Product::factory()->create(['vendor_id' => $vendor->id, 'price' => 50, 'compare_price' => 50, 'category' => 'home']);
        Product::factory()->create(['vendor_id' => $vendor->id, 'price' => 50, 'compare_price' => null, 'category' => 'home']);

        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Home/Index')
            ->has('sections.dailyDeals', 1));
    }
}
