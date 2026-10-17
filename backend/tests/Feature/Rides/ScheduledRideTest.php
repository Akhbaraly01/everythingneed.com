<?php

namespace Tests\Feature\Rides;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * N-37 scheduled rides: optional future scheduled_for, bounded to 30
 * days, immediate rides unchanged.
 */
class ScheduledRideTest extends TestCase
{
    private function ridePayload(array $over = []): array
    {
        return array_merge([
            'pickup_address' => '12 Main St',
            'pickup_lat' => 40.7128,
            'pickup_lng' => -74.0060,
            'dropoff_address' => '300 Broadway',
            'dropoff_lat' => 40.7282,
            'dropoff_lng' => -74.0020,
            'ride_type' => 'economy',
        ], $over);
    }

    public function test_immediate_ride_still_works_without_schedule(): void
    {
        $this->actingAsUser();

        $res = $this->postJson('/api/rides/request', $this->ridePayload());

        $res->assertStatus(201);
        $this->assertNull($res->json('data.scheduled_for'));
        $this->assertSame('requested', $res->json('data.status'));
    }

    public function test_scheduled_ride_persists_the_time(): void
    {
        $this->actingAsUser();
        $when = now()->addHours(3);

        $res = $this->postJson('/api/rides/request', $this->ridePayload([
            'scheduled_for' => $when->toIso8601String(),
        ]));

        $res->assertStatus(201);
        $this->assertNotNull($res->json('data.scheduled_for'));

        $row = DB::table('rides')->find($res->json('data.id'));
        $this->assertNotNull($row->scheduled_for);
    }

    public function test_past_schedule_is_rejected(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/rides/request', $this->ridePayload([
            'scheduled_for' => now()->subHour()->toIso8601String(),
        ]))->assertStatus(422)->assertJsonValidationErrors(['scheduled_for']);
    }

    public function test_schedule_beyond_thirty_days_is_rejected(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/rides/request', $this->ridePayload([
            'scheduled_for' => now()->addDays(31)->toIso8601String(),
        ]))->assertStatus(422)->assertJsonValidationErrors(['scheduled_for']);
    }

    public function test_out_of_range_coordinates_are_rejected(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/rides/request', $this->ridePayload([
            'pickup_lat' => 91,
        ]))->assertStatus(422)->assertJsonValidationErrors(['pickup_lat']);
    }

    public function test_guest_cannot_request_a_ride(): void
    {
        $this->postJson('/api/rides/request', $this->ridePayload())->assertStatus(401);
    }
}
