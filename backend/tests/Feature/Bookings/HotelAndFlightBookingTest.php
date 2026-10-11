<?php

namespace Tests\Feature\Bookings;

use Tests\TestCase;
use Modules\Hotels\Entities\Hotel;
use Modules\Hotels\Entities\HotelRoom;

class HotelAndFlightBookingTest extends TestCase
{
    private function makeHotelWithRoom(): array
    {
        $hotel = Hotel::create([
            'name' => 'Test Grand Hotel',
            'address' => '1 Test Ave',
            'city' => 'Springfield',
            'state' => 'ST',
            'country' => 'US',
            'star_rating' => 4,
            'description' => 'Nice place',
            'is_active' => true,
        ]);

        $room = HotelRoom::create([
            'hotel_id' => $hotel->id,
            'room_type' => 'Deluxe King',
            'price_per_night' => 150.00,
            'capacity' => 2,
            'is_available' => true,
        ]);

        return [$hotel, $room];
    }

    public function test_hotel_reservation_computes_total_and_blocks_overlap(): void
    {
        [, $room] = $this->makeHotelWithRoom();
        $guest = $this->actingAsUser();

        $checkIn = now()->addDays(3)->toDateString();
        $checkOut = now()->addDays(5)->toDateString();

        $res = $this->postJson("/api/hotels/{$room->hotel_id}/reserve", [
            'room_id' => $room->id,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'guests' => 2,
        ]);

        $res->assertStatus(201)
            ->assertJsonFragment(['message' => 'Reservation created. Complete payment to confirm it.']);
        $this->assertSame('pending', \Modules\Hotels\Entities\HotelReservation::find($res->json('data.id'))->status);

        // Payment confirms the reservation (spec 54/97)
        $this->postJson("/api/hotels/reservations/{$res->json('data.id')}/pay", ['method' => 'card'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment_status', 'paid');

        // 2 nights A- 150
        $this->assertEquals(300.00, (float) \Modules\Hotels\Entities\HotelReservation::find($res->json('data.id'))->total_amount);

        // Overlapping reservation is rejected
        $overlap = $this->postJson("/api/hotels/{$room->hotel_id}/reserve", [
            'room_id' => $room->id,
            'check_in' => now()->addDays(4)->toDateString(),
            'check_out' => now()->addDays(6)->toDateString(),
            'guests' => 1,
        ]);
        $overlap->assertStatus(422);
    }

    public function test_guest_can_list_and_cancel_own_reservations(): void
    {
        [, $room] = $this->makeHotelWithRoom();
        $guest = $this->actingAsUser();

        $reservationId = $this->postJson("/api/hotels/{$room->hotel_id}/reserve", [
            'room_id' => $room->id,
            'check_in' => now()->addDays(10)->toDateString(),
            'check_out' => now()->addDays(12)->toDateString(),
            'guests' => 1,
        ])->json('data.id');

        $mine = $this->getJson('/api/hotels/reservations/mine');
        $mine->assertOk()->assertJsonFragment(['id' => $reservationId]);

        $this->postJson("/api/hotels/reservations/{$reservationId}/cancel")
            ->assertOk()
            ->assertJsonFragment(['message' => 'Reservation cancelled successfully']);
    }

    public function test_flight_search_and_booking_flow(): void
    {
        $flight = \Modules\Rides\Entities\Flight::create([
            'flight_number' => 'EN-TST',
            'airline' => 'EverythingAir',
            'origin_city' => 'Boston',
            'origin_code' => 'BOS',
            'destination_city' => 'Washington',
            'destination_code' => 'DCA',
            'departure_time' => '10:00',
            'arrival_time' => '11:30',
            'duration_minutes' => 90,
            'price' => 145.00,
            'seats_total' => 100,
            'seats_available' => 50,
            'days_of_week' => [0, 1, 2, 3, 4, 5, 6],
            'is_active' => true,
        ]);

        // Public search finds it
        $search = $this->getJson('/api/flights?origin=BOS&destination=DC');
        $search->assertOk()->assertJsonFragment(['id' => $flight->id]);

        // Book two seats on a valid travel date
        $traveller = $this->actingAsUser();
        $travelDate = now()->addDays((7 - (int) now()->dayOfWeek + 1) % 7 + 1)->toDateString();

        $book = $this->postJson("/api/flights/{$flight->id}/book", [
            'travel_date' => now()->addDays(2)->toDateString(),
            'passengers' => [
                ['name' => 'Alice Traveller', 'passport' => 'P1234567'],
                ['name' => 'Bob Traveller'],
            ],
        ]);

        $book->assertStatus(201)
            ->assertJsonStructure(['message', 'data' => ['booking_id', 'reference', 'status']]);

        // Seats decremented
        $this->assertEquals(48, $flight->fresh()->seats_available);

        // Booking persisted with reference and passengers
        $bookingId = $book->json('data.booking_id');
        $booking = \Modules\Bookings\Entities\Booking::find($bookingId);
        $this->assertEquals('confirmed', $booking->status);
        $this->assertCount(2, $booking->details['passengers']);

        // Overbooking attempt fails when seats run out
        \Modules\Rides\Entities\Flight::where('id', $flight->id)->update(['seats_available' => 1]);
        $overbook = $this->actingAsUser();
        $this->postJson("/api/flights/{$flight->id}/book", [
            'travel_date' => now()->addDays(3)->toDateString(),
            'passengers' => [
                ['name' => 'X One'], ['name' => 'X Two'], ['name' => 'X Three'],
            ],
        ])->assertStatus(422);
    }
}
