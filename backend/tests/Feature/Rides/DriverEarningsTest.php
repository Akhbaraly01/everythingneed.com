<?php

namespace Tests\Feature\Rides;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * N-39 driver earnings view: aggregates confirmed fares, driver-scoped
 * ride history, driver-profile gating.
 */
class DriverEarningsTest extends TestCase
{
    private function registerDriver(object $user): string
    {
        $this->actingAs($user, 'sanctum');
        $this->postJson('/api/drivers', [
            'full_name' => 'Ada Driver',
            'phone' => '+233200000001',
            'license_number' => 'LIC-' . strtoupper(Str::random(6)),
            'vehicle_type' => 'sedan',
        ])->assertStatus(201);

        return (string) DB::table('drivers')->where('user_id', $user->id)->value('id');
    }

    private function seedRide(string $driverId, float $fare, string $status, string $completedAt): void
    {
        DB::table('rides')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => (string) Str::uuid(),
            'driver_id' => $driverId,
            'pickup_address' => 'A',
            'pickup_lat' => 40.7,
            'pickup_lng' => -74.0,
            'dropoff_address' => 'B',
            'dropoff_lat' => 40.8,
            'dropoff_lng' => -73.9,
            'status' => $status,
            'fare' => $fare,
            'currency' => 'USD',
            'completed_at' => $completedAt,
            'created_at' => $completedAt,
            'updated_at' => $completedAt,
        ]);
    }

    public function test_guest_cannot_read_driver_earnings(): void
    {
        $this->getJson('/api/drivers/earnings')->assertStatus(401);
        $this->getJson('/api/drivers/rides')->assertStatus(401);
    }

    public function test_non_driver_gets_403(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/drivers/earnings')->assertStatus(403);
        $this->getJson('/api/drivers/rides')->assertStatus(403);
    }

    public function test_earnings_aggregate_only_completed_fares(): void
    {
        $me = $this->createUser();
        $driverId = $this->registerDriver($me);

        $this->seedRide($driverId, 25.0, 'completed', now()->subHour()->toDateTimeString());
        $this->seedRide($driverId, 40.0, 'completed', now()->subDays(2)->toDateTimeString());
        // Not counted: cancelled with a leftover fare, and someone else's ride.
        $this->seedRide($driverId, 999.0, 'cancelled', now()->subHour()->toDateTimeString());
        $otherDriverId = (string) Str::uuid();
        $this->seedRide($otherDriverId, 500.0, 'completed', now()->subHour()->toDateTimeString());

        $res = $this->getJson('/api/drivers/earnings')->assertOk();
        $data = $res->json('data');

        $this->assertEqualsWithDelta(65.0, (float) $data['total_earned'], 0.01);
        $this->assertEqualsWithDelta(25.0, (float) $data['today'], 0.01);
        $this->assertEqualsWithDelta(65.0, (float) $data['month'], 0.01);
        $this->assertSame(2, $data['ride_count']);
        $this->assertEqualsWithDelta(32.5, (float) $data['average_fare'], 0.01);
        $this->assertSame('USD', $data['currency']);
        $this->assertCount(2, $data['recent']);
        $this->assertSame('Ada Driver', $data['driver']['full_name']);
    }

    public function test_driver_ride_list_is_scoped_to_self(): void
    {
        $me = $this->createUser();
        $driverId = $this->registerDriver($me);

        $this->seedRide($driverId, 20.0, 'completed', now()->subHour()->toDateTimeString());
        $this->seedRide($driverId, 15.0, 'cancelled', now()->subHours(2)->toDateTimeString());
        $this->seedRide((string) Str::uuid(), 80.0, 'completed', now()->subHour()->toDateTimeString());

        $all = $this->getJson('/api/drivers/rides')->assertOk();
        $this->assertSame(2, $all->json('meta.total'));

        $completed = $this->getJson('/api/drivers/rides?status=completed')->assertOk();
        $this->assertSame(1, $completed->json('meta.total'));
    }
}
