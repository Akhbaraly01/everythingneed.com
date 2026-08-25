<?php

namespace Tests\Feature\Hotels;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Hotels\Entities\Hotel;
use Tests\TestCase;

class HotelLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function makeHotelWithRoom(): array
    {
        $hotel = Hotel::create([
            'name' => 'Test Grand Hotel',
            'address' => '1 Test Ave',
            'city' => 'Accra',
            'country' => 'Ghana',
            'star_rating' => 4,
            'is_active' => true,
        ]);

        $roomId = (string) \Illuminate\Support\Str::uuid();
        \Illuminate\Support\Facades\DB::table('hotel_rooms')->insert([
            'id' => $roomId,
            'hotel_id' => $hotel->id,
            'room_type' => 'deluxe',
            'price_per_night' => 120,
            'currency' => 'USD',
            'capacity' => 2,
            'is_available' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$hotel, $roomId];
    }

    public function test_reservation_issues_reference_and_supports_checkin_checkout(): void
    {
        [$hotel, $roomId] = $this->makeHotelWithRoom();
        $guest = User::factory()->create();

        $reserve = $this->actingAs($guest)->postJson("/api/hotels/{$hotel->id}/reserve", [
            'room_id' => $roomId,
            'check_in' => now()->addDays(3)->toDateString(),
            'check_out' => now()->addDays(5)->toDateString(),
            'guests' => 2,
        ]);
        $reserve->assertStatus(201);

        $reservationId = $reserve->json('data.id') ?? null;

        // Reference generated and unique-shaped
        if (!$reservationId) {
            // Some controllers return the model directly
            $reservationId = $this->actingAs($guest)
                ->getJson('/api/hotels/reservations/mine')
                ->json('data.0.id');
        }
        $this->assertNotNull($reservationId);

        $mine = $this->actingAs($guest)->getJson('/api/hotels/reservations/mine');
        $row = collect($mine->json('data'))->firstWhere('id', $reservationId);
        $this->assertStringStartsWith('HTR-', $row['reference']);

        // check-in → check-out lifecycle
        $this->actingAs($guest)->postJson("/api/hotels/reservations/{$reservationId}/check-in")
            ->assertStatus(200);
        $this->actingAs($guest)->postJson("/api/hotels/reservations/{$reservationId}/check-out")
            ->assertStatus(200);
    }

    public function test_double_checkin_is_rejected(): void
    {
        [, $roomId] = $this->makeHotelWithRoom();
        $guest = User::factory()->create();

        $this->actingAs($guest)->postJson('/api/hotels/' . Hotel::first()->id . '/reserve', [
            'room_id' => $roomId,
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(2)->toDateString(),
            'guests' => 1,
        ])->assertStatus(201);

        $rid = \Modules\Hotels\Entities\HotelReservation::first()->id;

        $this->actingAs($guest)->postJson("/api/hotels/reservations/{$rid}/check-in")->assertStatus(200);
        $this->actingAs($guest)->postJson("/api/hotels/reservations/{$rid}/check-in")->assertStatus(422);
    }
}
