<?php

namespace Tests\Feature\Rides;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Rides\Entities\Flight;
use Tests\TestCase;

class FlightBookingTest extends TestCase
{
    use RefreshDatabase;

    private function createFlight(int $seats = 50): Flight
    {
        return Flight::create([
            'flight_number' => 'EN-'.strtoupper(substr(bin2hex(random_bytes(4)), 0, 6)),
            'airline' => 'EverythingAir',
            'origin_city' => 'Accra',
            'origin_code' => 'ACC',
            'destination_city' => 'London',
            'destination_code' => 'LHR',
            'departure_time' => '09:30',
            'arrival_time' => '14:45',
            'duration_minutes' => 375,
            'price' => 420.00,
            'seats_available' => $seats,
            'days_of_week' => [1, 3, 5],
        ]);
    }

    public function test_guest_can_search_flights_by_route_and_weekday(): void
    {
        // Monday flight (day 1)
        $this->createFlight();
        // Saturday-only flight (day 6)
        Flight::create([
            'flight_number' => 'EN-WKND',
            'airline' => 'EverythingAir',
            'origin_city' => 'Accra',
            'origin_code' => 'ACC',
            'destination_city' => 'Dubai',
            'destination_code' => 'DXB',
            'departure_time' => '23:00',
            'arrival_time' => '08:00',
            'duration_minutes' => 540,
            'price' => 510.00,
            'days_of_week' => [6],
        ]);

        $routeSearch = $this->getJson('/api/flights?origin=ACC');
        $routeSearch->assertStatus(200);
        $this->assertEquals(2, $routeSearch->json('meta.total'));

        // A known Monday
        $monday = $this->nextWeekday(1);
        $daySearch = $this->getJson('/api/flights?origin=ACC&date='.$monday->toDateString());
        $this->assertEquals(1, $daySearch->json('meta.total'));
        $this->assertEquals('London', $daySearch->json('data.0.destination_city'));
    }

    public function test_booking_decrements_seats_and_cancel_restores_them(): void
    {
        $user = User::factory()->create();
        $flight = $this->createFlight(seats: 10);

        // Book 2 passengers
        $book = $this->actingAs($user)->postJson("/api/flights/{$flight->id}/book", [
            'travel_date' => $this->nextWeekday(1)->addDay()->toDateString(),
            'passengers' => [
                ['name' => 'Ama Serwaa', 'passport' => 'A1234567'],
                ['name' => 'Kofi Mensah'],
            ],
        ]);

        $book->assertStatus(201);
        $reference = $book->json('data.reference');
        $bookingId = $book->json('data.booking_id');

        $this->assertNotNull($reference);
        $this->assertEquals(8, $flight->fresh()->seats_available);

        $booking = DB::table('bookings')->where('id', $bookingId)->first();
        $this->assertSame('flight', $booking->service_type);
        $details = json_decode($booking->details, true);
        $this->assertCount(2, $details['passengers']);
        $this->assertEquals(840.0, (float) $details['total_price']);

        // Overbook guard
        $overbook = $this->actingAs($user)->postJson("/api/flights/{$flight->id}/book", [
            'travel_date' => $this->nextWeekday(1)->addDay()->toDateString(),
            'passengers' => array_fill(0, 9, ['name' => 'Extra Passenger']),
        ]);
        $overbook->assertStatus(422);
        $this->assertEquals(8, $flight->fresh()->seats_available);

        // Cancel releases seats back
        $cancel = $this->actingAs($user)->postJson("/api/bookings/{$bookingId}/cancel");
        $cancel->assertStatus(200);
        $this->assertEquals('cancelled', $cancel->json('data.status'));
        $this->assertEquals(10, $flight->fresh()->seats_available);
    }

    public function test_travel_date_must_be_future(): void
    {
        $user = User::factory()->create();
        $flight = $this->createFlight();

        $response = $this->actingAs($user)->postJson("/api/flights/{$flight->id}/book", [
            'travel_date' => now()->subDay()->toDateString(),
            'passengers' => [['name' => 'Past Traveller']],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['travel_date']);
    }

    public function test_flight_confirmation_page_is_owner_only(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $flight = $this->createFlight();

        $booked = $this->actingAs($owner)->postJson("/api/flights/{$flight->id}/book", [
            'travel_date' => $this->nextWeekday(1)->addDay()->toDateString(),
            'passengers' => [['name' => 'Owner Only']],
        ])->json('data.booking_id');

        $this->actingAs($stranger)->get("/flights/confirmation/{$booked}")
            ->assertStatus(403);

        $this->actingAs($owner)->get("/flights/confirmation/{$booked}")
            ->assertStatus(200);
    }

    private function nextWeekday(int $dayOfWeek): \Carbon\Carbon
    {
        $date = now()->startOfDay();
        while ((int) $date->dayOfWeek !== $dayOfWeek || $date->lte(now())) {
            $date->addDay();
        }

        return $date;
    }
}
