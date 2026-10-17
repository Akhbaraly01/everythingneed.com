<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedBooking;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 13 scheduling + booking: slot confirmation, collision protection,
 * reschedule policy, cancellation, and ownership.
 */
class NeedBookingTest extends TestCase
{
    private function acceptedRequest(object $owner, object $provider): string
    {
        $category = NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);

        $this->actingAs($owner, 'sanctum');
        $requestId = $this->postJson('/api/need-requests', [
            'title' => 'Deep clean 3-bedroom apartment',
            'description' => 'Full deep clean including windows.',
            'category_id' => $category->id,
            'pricing_basis' => 'quote',
        ])->assertStatus(201)->json('data.id');

        $this->actingAs($provider, 'sanctum');
        $offerId = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 120,
            'message' => 'Available tomorrow.',
        ])->assertStatus(201)->json('data.id');

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/accept")->assertOk();

        return $requestId;
    }

    public function test_owner_books_a_slot_on_accepted_request(): void
    {
        // Improvement cycle: the session zone is pinned to UTC so slot
        // instants never skew with the database host zone.
        $this->assertEquals(
            'UTC',
            \Illuminate\Support\Facades\DB::selectOne('SHOW TIME ZONE')->TimeZone
        );

        $owner = $this->actingAsUser();
        $provider = $this->actingAsUser();
        $requestId = $this->acceptedRequest($owner, $provider);

        $this->actingAs($owner, 'sanctum');
        $booking = $this->postJson("/api/need-requests/{$requestId}/bookings", [
            'scheduled_start' => now()->addDays(3)->toIso8601String(),
            'scheduled_end' => now()->addDays(3)->addHours(2)->toIso8601String(),
            'timezone' => 'Africa/Lagos',
        ])->assertStatus(201);

        $this->assertEquals('scheduled', $booking->json('data.status'));
        $this->assertEquals((string) $provider->id, $booking->json('data.provider_id'));

        $this->getJson("/api/need-requests/{$requestId}/bookings")->assertOk()
            ->assertJsonFragment(['id' => $booking->json('data.id')]);
    }

    public function test_same_request_cannot_be_booked_twice(): void
    {
        $owner = $this->actingAsUser();
        $provider = $this->actingAsUser();
        $requestId = $this->acceptedRequest($owner, $provider);

        $this->actingAs($owner, 'sanctum');
        $slot = [
            'scheduled_start' => now()->addDays(3)->toIso8601String(),
            'scheduled_end' => now()->addDays(3)->addHours(2)->toIso8601String(),
        ];
        $this->postJson("/api/need-requests/{$requestId}/bookings", $slot)->assertStatus(201);
        $this->postJson("/api/need-requests/{$requestId}/bookings", $slot)
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'This request is already booked']);

        $this->assertEquals(1, NeedBooking::where('need_request_id', $requestId)->count());
    }

    public function test_provider_overlap_is_rejected(): void
    {
        $owner = $this->actingAsUser();
        $provider = $this->actingAsUser();
        $requestA = $this->acceptedRequest($owner, $provider);
        $requestB = $this->acceptedRequest($owner, $provider);

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$requestA}/bookings", [
            'scheduled_start' => now()->addDays(3)->setHour(10)->toIso8601String(),
            'scheduled_end' => now()->addDays(3)->setHour(12)->toIso8601String(),
        ])->assertStatus(201);

        // Overlapping slot for the same provider: refused.
        $this->postJson("/api/need-requests/{$requestB}/bookings", [
            'scheduled_start' => now()->addDays(3)->setHour(11)->toIso8601String(),
            'scheduled_end' => now()->addDays(3)->setHour(13)->toIso8601String(),
        ])->assertStatus(422)
            ->assertJsonFragment(['message' => 'The provider is already booked for that slot']);

        // Adjacent slot is fine (end == start, no overlap).
        $this->postJson("/api/need-requests/{$requestB}/bookings", [
            'scheduled_start' => now()->addDays(3)->setHour(12)->toIso8601String(),
            'scheduled_end' => now()->addDays(3)->setHour(14)->toIso8601String(),
        ])->assertStatus(201);
    }

    public function test_reschedule_policy_and_cancel_rules(): void
    {
        $owner = $this->actingAsUser();
        $provider = $this->actingAsUser();
        $requestId = $this->acceptedRequest($owner, $provider);

        $this->actingAs($owner, 'sanctum');
        $bookingId = $this->postJson("/api/need-requests/{$requestId}/bookings", [
            'scheduled_start' => now()->addDays(5)->toIso8601String(),
            'scheduled_end' => now()->addDays(5)->addHours(2)->toIso8601String(),
        ])->assertStatus(201)->json('data.id');

        // Far out: free move, counter increments.
        $this->postJson("/api/need-bookings/{$bookingId}/reschedule", [
            'scheduled_start' => now()->addDays(6)->toIso8601String(),
            'scheduled_end' => now()->addDays(6)->addHours(2)->toIso8601String(),
        ])->assertOk();
        $this->assertEquals(1, NeedBooking::find($bookingId)->reschedule_count);

        // Inside 24h: locked.
        NeedBooking::find($bookingId)->update([
            'scheduled_start' => now()->addHours(10),
            'scheduled_end' => now()->addHours(12),
        ]);
        $this->postJson("/api/need-bookings/{$bookingId}/reschedule", [
            'scheduled_start' => now()->addHours(11)->toIso8601String(),
            'scheduled_end' => now()->addHours(13)->toIso8601String(),
        ])->assertStatus(422);

        // Cancel demands a reason and records an audit note.
        $this->postJson("/api/need-bookings/{$bookingId}/cancel", [])->assertStatus(422);
        $this->postJson("/api/need-bookings/{$bookingId}/cancel", [
            'reason' => 'Client travelling, will rebook.',
        ])->assertOk();
        $this->assertEquals('cancelled', NeedBooking::find($bookingId)->status);
        $this->assertDatabaseHas('need_request_events', [
            'need_request_id' => $requestId,
            'action' => 'booking_cancelled',
        ]);

        // The request itself survives the slot cancellation.
        $this->assertEquals('accepted', NeedRequest::find($requestId)->status);

        // ...and the freed slot can be rebooked (partial unique index only
        // guards live bookings).
        $this->postJson("/api/need-requests/{$requestId}/bookings", [
            'scheduled_start' => now()->addDays(8)->toIso8601String(),
            'scheduled_end' => now()->addDays(8)->addHours(2)->toIso8601String(),
        ])->assertStatus(201);
    }

    public function test_booking_authorization(): void
    {
        $owner = $this->actingAsUser();
        $provider = $this->actingAsUser();
        $requestId = $this->acceptedRequest($owner, $provider);

        // Strangers can neither book nor view.
        $this->actingAsUser();
        $this->postJson("/api/need-requests/{$requestId}/bookings", [
            'scheduled_start' => now()->addDays(3)->toIso8601String(),
            'scheduled_end' => now()->addDays(3)->addHours(2)->toIso8601String(),
        ])->assertStatus(403);
        $this->getJson("/api/need-requests/{$requestId}/bookings")->assertStatus(403);

        // Booking follows acceptance: pending requests refuse.
        $this->actingAs($owner, 'sanctum');
        $pendingId = $this->postJson('/api/need-requests', [
            'title' => 'Not yet accepted',
            'description' => 'No offer accepted.',
            'pricing_basis' => 'quote',
        ])->assertStatus(201)->json('data.id');
        $this->postJson("/api/need-requests/{$pendingId}/bookings", [
            'scheduled_start' => now()->addDays(3)->toIso8601String(),
            'scheduled_end' => now()->addDays(3)->addHours(2)->toIso8601String(),
        ])->assertStatus(422);
    }
}
