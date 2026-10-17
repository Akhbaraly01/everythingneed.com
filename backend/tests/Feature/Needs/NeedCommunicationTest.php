<?php

namespace Tests\Feature\Needs;

use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 14 communication + notifications: request-linked chats stay
 * bilateral (owner ↔ bidding providers), and lifecycle events persist
 * notification rows for their counterparty.
 */
class NeedCommunicationTest extends TestCase
{
    private function category(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
    }

    private function requestWithBid(object $owner, object $provider): string
    {
        $category = $this->category();

        $this->actingAs($owner, 'sanctum');
        $requestId = $this->postJson('/api/need-requests', [
            'title' => 'Deep clean 3-bedroom apartment',
            'description' => 'Full deep clean including windows.',
            'category_id' => $category->id,
            'pricing_basis' => 'quote',
        ])->assertStatus(201)->json('data.id');

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 120,
            'message' => 'Available tomorrow.',
        ])->assertStatus(201);

        return $requestId;
    }

    public function test_owner_and_bidder_can_open_request_chat(): void
    {
        $owner = $this->actingAsUser();
        $provider = $this->actingAsUser();
        $requestId = $this->requestWithBid($owner, $provider);

        // Owner opens a thread with the bidder.
        $this->actingAs($owner, 'sanctum');
        $conv = $this->postJson('/api/chat/conversations', [
            'recipient_id' => $provider->id,
            'booking_id' => $requestId,
        ])->assertStatus(201)->json('data.id');

        // Bidder replies inside the same thread.
        $this->actingAs($provider, 'sanctum');
        $same = $this->postJson('/api/chat/conversations', [
            'recipient_id' => $owner->id,
            'booking_id' => $requestId,
        ])->assertStatus(201)->json('data.id');
        $this->assertEquals($conv, $same);

        $this->postJson("/api/chat/{$conv}/messages", [
            'message' => 'I can start Friday.',
        ])->assertStatus(201);

        $this->actingAs($owner, 'sanctum');
        $this->getJson("/api/chat/{$conv}/messages")->assertOk()
            ->assertJsonFragment(['message' => 'I can start Friday.']);
    }

    public function test_stranger_cannot_cold_message_about_a_request(): void
    {
        $owner = $this->actingAsUser();
        $provider = $this->actingAsUser();
        $requestId = $this->requestWithBid($owner, $provider);

        $stranger = $this->actingAsUser();

        // No bid, no thread — even naming the owner.
        $this->postJson('/api/chat/conversations', [
            'recipient_id' => $owner->id,
            'booking_id' => $requestId,
        ])->assertStatus(403);

        // A bidder cannot pull in an unrelated third party either.
        $this->actingAs($provider, 'sanctum');
        $this->postJson('/api/chat/conversations', [
            'recipient_id' => $stranger->id,
            'booking_id' => $requestId,
        ])->assertStatus(403);
    }

    public function test_lifecycle_events_persist_notifications(): void
    {
        $owner = $this->actingAsUser();
        $provider = $this->actingAsUser();
        $requestId = $this->requestWithBid($owner, $provider);

        // Accept notifies the provider.
        $this->actingAs($owner, 'sanctum');
        $offerId = NeedRequest::find($requestId)->offers()->value('id');
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/accept")->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $provider->id,
            'type' => 'need_offer_accepted',
        ]);

        // Booking notifies the provider; reschedule notifies the counterparty.
        $bookingId = $this->postJson("/api/need-requests/{$requestId}/bookings", [
            'scheduled_start' => now()->addDays(4)->toIso8601String(),
            'scheduled_end' => now()->addDays(4)->addHours(2)->toIso8601String(),
        ])->assertStatus(201)->json('data.id');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $provider->id,
            'type' => 'need_booked',
        ]);

        $this->postJson("/api/need-bookings/{$bookingId}/reschedule", [
            'scheduled_start' => now()->addDays(5)->toIso8601String(),
            'scheduled_end' => now()->addDays(5)->addHours(2)->toIso8601String(),
        ])->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $provider->id,
            'type' => 'need_booking_rescheduled',
        ]);
    }

    public function test_non_request_booking_ids_keep_existing_behavior(): void
    {
        $alice = $this->actingAsUser();
        $bob = $this->actingAsUser();

        // No need request behind this id: global chat rules still apply.
        $this->actingAs($alice, 'sanctum');
        $this->postJson('/api/chat/conversations', [
            'recipient_id' => $bob->id,
            'booking_id' => (string) \Illuminate\Support\Str::uuid(),
        ])->assertStatus(201);
    }
}
