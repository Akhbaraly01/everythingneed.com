<?php

namespace Tests\Feature\Bookings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Bookings\Entities\Booking;
use Modules\Vendors\Entities\Vendor;
use Modules\Vendors\Entities\VendorService;
use Tests\TestCase;

class VendorBookingTest extends TestCase
{
    use RefreshDatabase;

    private function makeVendorService(User $owner): VendorService
    {
        $vendor = Vendor::factory()->create(['user_id' => $owner->id]);

        return VendorService::create([
            'vendor_id' => $vendor->id,
            'name' => 'Deep clean',
            'description' => 'Full apartment clean',
            'price' => 120,
            'duration_minutes' => 90,
            'is_active' => true,
        ]);
    }

    public function test_vendor_sees_bookings_for_their_services(): void
    {
        $owner = $this->createUser();
        $service = $this->makeVendorService($owner);

        $customer = $this->createUser();
        Booking::create([
            'user_id' => $customer->id,
            'service_type' => 'vendor_service',
            'service_id' => $service->id,
            'status' => 'pending',
            'details' => ['scheduled_date' => '2026-11-01', 'scheduled_time' => '10:00'],
        ]);

        $this->actingAs($owner, 'sanctum');
        $res = $this->getJson('/api/vendor/bookings')->assertOk();
        $this->assertSame(1, count($res->json('data')));
        $this->assertSame($customer->id, $res->json('data.0.user_id'));
    }

    public function test_vendor_confirms_and_completes_a_booking(): void
    {
        $owner = $this->createUser();
        $service = $this->makeVendorService($owner);
        $customer = $this->createUser();
        $booking = Booking::create([
            'user_id' => $customer->id,
            'service_type' => 'vendor_service',
            'service_id' => $service->id,
            'status' => 'pending',
        ]);

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/bookings/{$booking->id}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->postJson("/api/bookings/{$booking->id}/complete")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');
    }

    public function test_stranger_cannot_transition_a_vendor_booking(): void
    {
        $owner = $this->createUser();
        $service = $this->makeVendorService($owner);
        $customer = $this->createUser();
        $booking = Booking::create([
            'user_id' => $customer->id,
            'service_type' => 'vendor_service',
            'service_id' => $service->id,
            'status' => 'pending',
        ]);

        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum');
        $this->postJson("/api/bookings/{$booking->id}/confirm")->assertForbidden();

        // Unrelated vendor's owner also cannot touch it.
        $otherOwner = $this->createUser();
        $this->makeVendorService($otherOwner);
        $this->actingAs($otherOwner, 'sanctum');
        $this->postJson("/api/bookings/{$booking->id}/confirm")->assertForbidden();
    }

    public function test_booking_owner_may_still_run_transitions(): void
    {
        $owner = $this->createUser();
        $service = $this->makeVendorService($owner);
        $customer = $this->createUser();
        $booking = Booking::create([
            'user_id' => $customer->id,
            'service_type' => 'vendor_service',
            'service_id' => $service->id,
            'status' => 'pending',
        ]);

        // The base transition rule lets the booking's own user act on it (they
        // can always cancel / drive their own lifecycle); vendor ownership is
        // an additional grant, not a replacement.
        $this->actingAs($customer, 'sanctum');
        $this->postJson("/api/bookings/{$booking->id}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');
    }
}
