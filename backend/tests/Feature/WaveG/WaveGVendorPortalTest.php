<?php

namespace Tests\Feature\WaveG;

use App\Models\User;
use Modules\Bookings\Entities\Booking;
use Modules\Products\Entities\Product;
use Modules\Products\Entities\ProductReview;
use Modules\Vendors\Entities\Vendor;
use Modules\Vendors\Entities\VendorService;
use Tests\TestCase;

/**
 * Wave G - spec §34 vendor system: profile, settings, services CRUD,
 * bookings and reviews - all scoped to the caller's own vendor.
 */
class WaveGVendorPortalTest extends TestCase
{
    private Vendor $vendor;
    private User $vendorUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->vendorUser = $this->createVendorUser();
        $this->vendor = Vendor::create([
            'user_id' => $this->vendorUser->id,
            'store_name' => 'Portal Store',
            'category' => 'electronics',
            'is_verified' => true,
        ]);
    }

    public function test_portal_pages_require_auth_and_render_for_vendors(): void
    {
        foreach (['/vendor/dashboard', '/vendor/profile', '/vendor/services', '/vendor/bookings', '/vendor/reviews', '/vendor/earnings', '/vendor/settings'] as $path) {
            $this->get($path)->assertStatus(302);
        }

        $this->actingAs($this->vendorUser);
        foreach (['/vendor/dashboard', '/vendor/profile', '/vendor/services', '/vendor/bookings', '/vendor/reviews', '/vendor/earnings', '/vendor/settings'] as $path) {
            $this->get($path)->assertStatus(200);
        }
    }

    public function test_profile_returns_own_vendor_and_updates(): void
    {
        $this->actingAs($this->vendorUser, 'sanctum')
            ->getJson('/api/vendor/profile')
            ->assertStatus(200)
            ->assertJsonPath('data.vendor.store_name', 'Portal Store')
            ->assertJsonPath('data.user.id', $this->vendorUser->id);

        $this->actingAs($this->vendorUser, 'sanctum')
            ->putJson('/api/vendor/profile', [
                'store_name' => 'Renamed Portal Store',
                'category' => 'gadgets',
                'description' => 'We sell gadgets',
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('vendors', [
            'id' => $this->vendor->id,
            'store_name' => 'Renamed Portal Store',
            'category' => 'gadgets',
        ]);
    }

    public function test_profile_forbidden_without_vendor_profile(): void
    {
        $plainUser = $this->createUser();

        $this->actingAs($plainUser, 'sanctum')
            ->getJson('/api/vendor/profile')
            ->assertStatus(403);
    }

    public function test_settings_toggle_accepting_orders(): void
    {
        $this->actingAs($this->vendorUser, 'sanctum')
            ->putJson('/api/vendor/settings', ['accepting_orders' => false])
            ->assertStatus(200)
            ->assertJsonPath('data.settings.accepting_orders', false);

        $this->assertTrue($this->vendor->fresh()->isAcceptingOrders() === false);
    }

    public function test_services_crud_is_scoped_to_own_vendor(): void
    {
        $api = $this->actingAs($this->vendorUser, 'sanctum');

        $created = $api->postJson('/api/vendor/services', [
            'name' => 'Deep clean',
            'description' => 'Two bedroom deep clean',
            'price' => 89.00,
            'duration_minutes' => 120,
            'is_active' => true,
        ]);
        $created->assertStatus(201);
        $serviceId = $created->json('data.id');

        $api->getJson('/api/vendor/services')->assertStatus(200)->assertJsonCount(1, 'data');
        $api->getJson("/api/vendor/services/{$serviceId}")->assertStatus(200);

        $api->putJson("/api/vendor/services/{$serviceId}", [
            'price' => 99.00,
            'is_active' => false,
        ])->assertStatus(200);

        $updated = VendorService::find($serviceId);
        $this->assertEquals(99.00, (float) $updated->price);
        $this->assertFalse((bool) $updated->is_active);

        // Another vendor cannot see or touch this service.
        $otherUser = $this->createVendorUser();
        Vendor::create(['user_id' => $otherUser->id, 'store_name' => 'Rival Store', 'category' => 'general']);
        $other = $this->actingAs($otherUser, 'sanctum');
        $other->getJson('/api/vendor/services')->assertStatus(200)->assertJsonCount(0, 'data');
        $other->getJson("/api/vendor/services/{$serviceId}")->assertStatus(404);
        $other->putJson("/api/vendor/services/{$serviceId}", ['price' => 1.00])->assertStatus(404);
        $other->deleteJson("/api/vendor/services/{$serviceId}")->assertStatus(404);

        $this->actingAs($this->vendorUser, 'sanctum');
        $this->deleteJson("/api/vendor/services/{$serviceId}")->assertStatus(200);
        $this->assertSoftDeleted('vendor_services', ['id' => $serviceId]);
        $this->actingAs($this->vendorUser, 'sanctum');
        $this->getJson('/api/vendor/services')->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_vendor_reviews_include_reviewer_and_product_names(): void
    {
        $product = Product::create([
            'vendor_id' => $this->vendor->id,
            'name' => 'Reviewed Product',
            'category' => 'electronics',
            'price' => 15.00,
            'stock_quantity' => 5,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $reviewer = User::factory()->create(['name' => 'Review Rita', 'email_verified_at' => now()]);
        ProductReview::create([
            'product_id' => $product->id,
            'user_id' => $reviewer->id,
            'rating' => 4,
            'comment' => 'Solid product',
        ]);

        $this->actingAs($this->vendorUser, 'sanctum')
            ->getJson('/api/vendor/reviews')
            ->assertStatus(200)
            ->assertJsonPath('data.0.reviewer_name', 'Review Rita')
            ->assertJsonPath('data.0.product_name', 'Reviewed Product');
    }

    public function test_vendor_bookings_list_shows_own_service_bookings(): void
    {
        $service = VendorService::create([
            'vendor_id' => $this->vendor->id,
            'name' => 'Consultation',
            'price' => 40.00,
            'is_active' => true,
        ]);

        $customer = User::factory()->create(['email_verified_at' => now()]);
        $this->actingAs($customer, 'sanctum')->postJson('/api/bookings', [
            'service_type' => 'vendor_service',
            'service_id' => $service->id,
            'scheduled_date' => now()->addDay()->toDateString(),
            'scheduled_time' => '10:30',
            'notes' => 'Morning slot please',
        ])->assertStatus(201);

        $this->actingAs($this->vendorUser, 'sanctum')
            ->getJson('/api/vendor/bookings')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.details.scheduled_time', '10:30');

        // A different vendor sees nothing.
        $otherUser = $this->createVendorUser();
        Vendor::create(['user_id' => $otherUser->id, 'store_name' => 'Other Store', 'category' => 'general']);
        $this->actingAs($otherUser, 'sanctum')
            ->getJson('/api/vendor/bookings')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');

        $this->assertSame(1, Booking::where('service_type', 'vendor_service')->count());
    }

    public function test_earnings_endpoint_answers_for_own_vendor(): void
    {
        $this->actingAs($this->vendorUser, 'sanctum')
            ->getJson('/api/vendor/earnings')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['total_earned', 'withdrawn', 'pending_withdrawals', 'available', 'currency']]);
    }
}
