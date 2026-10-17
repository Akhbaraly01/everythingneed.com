<?php

namespace Tests\Feature\Reviews;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Hotels\Entities\Hotel;
use Modules\Hotels\Entities\HotelReservation;
use Modules\Hotels\Entities\HotelRoom;
use Tests\TestCase;

/**
 * N-40 hotel reviews: existence + one-review-per-guest (checked twice —
 * pre-check and the partial unique index) + server-computed verified-guest
 * badge from a completed stay. Guests without an on-platform booking may
 * still review; they simply carry no badge.
 */
class HotelReviewTest extends TestCase
{
    use RefreshDatabase;

    private function hotel(): Hotel
    {
        return Hotel::create([
            'name' => 'Review Arms Hotel',
            'address' => '5 Harbour Rd',
            'city' => 'Accra',
            'country' => 'Ghana',
        ]);
    }

    private function stay(Hotel $hotel, User $user, string $status): HotelReservation
    {
        $room = HotelRoom::create([
            'hotel_id' => $hotel->id,
            'room_type' => 'Deluxe',
            'price_per_night' => 80,
            'capacity' => 2,
        ]);

        return HotelReservation::create([
            'user_id' => $user->id,
            'hotel_id' => $hotel->id,
            'room_id' => $room->id,
            'check_in_date' => now()->subDays(3)->toDateString(),
            'check_out_date' => now()->subDays(1)->toDateString(),
            'guests' => 1,
            'total_amount' => 160,
            'status' => $status,
        ]);
    }

    public function test_guest_can_review_hotel_once_and_unknown_hotel_404s(): void
    {
        $guest = $this->createUser();
        $hotel = $this->hotel();

        $this->actingAs($guest, 'sanctum')
            ->postJson('/api/reviews', [
                'reviewable_type' => 'hotel',
                'reviewable_id' => $hotel->id,
                'rating' => 5,
                'comment' => 'Quiet room, great breakfast.',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $guest->id,
            'reviewable_type' => 'hotel',
            'reviewable_id' => $hotel->id,
            'is_verified_purchase' => false,
        ]);

        // One per guest — second attempt is refused (422, not a 500 from
        // the unique index).
        $this->actingAs($guest, 'sanctum')
            ->postJson('/api/reviews', [
                'reviewable_type' => 'hotel',
                'reviewable_id' => $hotel->id,
                'rating' => 4,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'You already reviewed this hotel');

        // A stranger's review of a hotel that does not exist is a 404 —
        // no orphan reviewable rows.
        $other = $this->createUser();
        $this->actingAs($other, 'sanctum')
            ->postJson('/api/reviews', [
                'reviewable_type' => 'hotel',
                'reviewable_id' => (string) Str::uuid(),
                'rating' => 3,
            ])
            ->assertNotFound();
    }

    public function test_completed_stay_earns_the_verified_guest_badge(): void
    {
        $guest = $this->createUser();
        $hotel = $this->hotel();
        $this->stay($hotel, $guest, HotelReservation::STATUS_CHECKED_OUT);

        $this->actingAs($guest, 'sanctum')
            ->postJson('/api/reviews', [
                'reviewable_type' => 'hotel',
                'reviewable_id' => $hotel->id,
                'rating' => 5,
                'comment' => 'Verified stay.',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.is_verified_purchase', true);
    }

    public function test_hotel_reviews_list_filters_by_hotel(): void
    {
        $guest = $this->createUser();
        $hotel = $this->hotel();

        $this->actingAs($guest, 'sanctum')
            ->postJson('/api/reviews', [
                'reviewable_type' => 'hotel',
                'reviewable_id' => $hotel->id,
                'rating' => 4,
                'comment' => 'Nice.',
            ])
            ->assertStatus(201);

        $list = $this->actingAs($guest, 'sanctum')
            ->getJson("/api/reviews?reviewable_type=hotel&reviewable_id={$hotel->id}")
            ->assertOk();

        $this->assertCount(1, $list->json('data'));
        $this->assertSame('hotel', $list->json('data.0.reviewable_type'));
    }

    public function test_hotel_reviews_require_auth(): void
    {
        $hotel = $this->hotel();

        $this->postJson('/api/reviews', [
            'reviewable_type' => 'hotel',
            'reviewable_id' => $hotel->id,
            'rating' => 5,
        ])->assertStatus(401);
    }
}
