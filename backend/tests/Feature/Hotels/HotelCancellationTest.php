<?php

namespace Tests\Feature\Hotels;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Hotels\Entities\Hotel;
use Modules\Hotels\Entities\HotelReservation;
use Modules\Hotels\Entities\HotelRoom;
use Tests\TestCase;

/**
 * W11: hotel cancellation lifecycle edges.
 *
 * Complements HotelLifecycleTest (reserve + check-in/out) and
 * HotelAndFlightBookingTest (owner cancel): cancelling only works from
 * pending/confirmed, double cancels and post-stay cancels are rejected,
 * and strangers/guests stay locked out.
 */
class HotelCancellationTest extends TestCase
{
    use RefreshDatabase;

    private function makeHotelWithRoom(): array
    {
        $hotel = Hotel::create([
            'name' => 'Demo Hotel',
            'address' => '1 Demo Ave',
            'city' => 'Accra',
            'country' => 'GH',
            'is_active' => true,
        ]);
        $room = HotelRoom::create([
            'hotel_id' => $hotel->id,
            'room_type' => 'standard',
            'price_per_night' => 150,
            'currency' => 'USD',
            'capacity' => 2,
            'is_available' => true,
        ]);

        return [$hotel, $room];
    }

    private function reserve($user, HotelRoom $room, int $fromDays = 10, int $toDays = 12): string
    {
        return $this->actingAs($user, 'sanctum')
            ->postJson("/api/hotels/{$room->hotel_id}/reserve", [
                'room_id' => $room->id,
                'check_in' => now()->addDays($fromDays)->toDateString(),
                'check_out' => now()->addDays($toDays)->toDateString(),
                'guests' => 2,
            ])
            ->assertStatus(201)
            ->json('data.id');
    }

    public function test_owner_cancels_reservation_and_double_cancel_fails(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/cancel")
            ->assertStatus(422);
    }

    public function test_cancel_after_checkin_is_rejected(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/pay", ['method' => 'card'])
            ->assertOk();

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/check-in")
            ->assertOk();

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/cancel")
            ->assertStatus(422);

        $this->assertSame('checked_in', HotelReservation::find($id)->status);
    }

    public function test_checkin_before_payment_is_rejected(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        // Reserve leaves the booking pending until it is paid.
        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/check-in")
            ->assertStatus(422);

        $this->assertSame('pending', HotelReservation::find($id)->status);
    }

    public function test_stranger_cannot_cancel(): void
    {
        $guest = $this->createUser();
        $stranger = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/cancel")
            ->assertStatus(403);

        $this->assertSame('pending', HotelReservation::find($id)->status);
    }

    public function test_guest_cancel_is_unauthenticated(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $reservation = HotelReservation::create([
            'reference' => 'HTR-T-GUEST401',
            'user_id' => $guest->id,
            'hotel_id' => $hotel->id,
            'room_id' => $room->id,
            'check_in_date' => now()->addDays(10)->toDateString(),
            'check_out_date' => now()->addDays(12)->toDateString(),
            'guests' => 2,
            'total_amount' => 300,
            'currency' => 'USD',
            'status' => 'confirmed',
        ]);

        $this->postJson("/api/hotels/reservations/{$reservation->id}/cancel")
            ->assertStatus(401);
    }

    public function test_reference_is_unique_per_reservation(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();

        $first = $this->reserve($guest, $room, 10, 12);
        $second = $this->reserve($guest, $room, 14, 16);

        $ref1 = HotelReservation::find($first)->reference;
        $ref2 = HotelReservation::find($second)->reference;

        $this->assertNotEmpty($ref1);
        $this->assertNotEmpty($ref2);
        $this->assertNotSame($ref1, $ref2);
    }
}
