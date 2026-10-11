<?php

namespace Tests\Feature\Transport;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rides\Entities\Driver;
use Modules\Rides\Entities\Flight;
use Modules\Rides\Entities\Ride;
use Tests\TestCase;

/**
 * W6 admin transport console: role-gated listing of rides/flights,
 * server-side status filter + rider search, flight activation toggle.
 */
class AdminTransportConsoleTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        $admin = User::factory()->create();
        UserRole::create(['user_id' => $admin->id, 'role' => 'super_admin']);

        return $admin;
    }

    private function makeRide(User $rider, string $status, string $pickup = 'Oxford Street, Osu'): Ride
    {
        return Ride::create([
            'user_id' => $rider->id,
            'pickup_address' => $pickup,
            'pickup_lat' => 5.5560,
            'pickup_lng' => -0.1870,
            'dropoff_address' => 'Makola Market',
            'dropoff_lat' => 5.5430,
            'dropoff_lng' => -0.2130,
            'status' => $status,
            'fare' => 32.50,
            'currency' => 'GHS',
        ]);
    }

    private function makeFlight(): Flight
    {
        return Flight::create([
            'flight_number' => 'EW-101',
            'airline' => 'Everything Air',
            'origin_city' => 'Accra',
            'origin_code' => 'ACC',
            'destination_city' => 'Lagos',
            'destination_code' => 'LOS',
            'departure_time' => '08:30',
            'arrival_time' => '10:15',
            'duration_minutes' => 105,
            'price' => 480,
            'seats_total' => 120,
            'seats_available' => 96,
            'days_of_week' => [1, 2, 3, 4, 5],
            'is_active' => true,
        ]);
    }

    public function test_admin_transport_consoles_are_role_gated(): void
    {
        $this->actingAs($this->superAdmin(), 'sanctum')
            ->getJson('/api/admin/transport/rides')->assertOk();
        $this->actingAs($this->superAdmin(), 'sanctum')
            ->getJson('/api/admin/transport/flights')->assertOk();

        $plain = User::factory()->create();
        $this->actingAs($plain, 'sanctum')
            ->getJson('/api/admin/transport/rides')->assertForbidden();
        $this->actingAs($plain, 'sanctum')
            ->getJson('/api/admin/transport/flights')->assertForbidden();
    }

    public function test_status_filter_and_rider_search_narrow_the_ride_queue(): void
    {
        $rider = User::factory()->create(['name' => 'Ama Serwaa']);
        $this->makeRide($rider, 'requested');
        $this->makeRide($rider, 'in_progress');
        $this->makeRide($rider, 'completed', 'Kotoka International Airport');

        $admin = $this->superAdmin();

        $inProgress = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/transport/rides?status=in_progress')->assertOk();
        $this->assertCount(1, $inProgress->json('data'));
        $this->assertSame('in_progress', $inProgress->json('data.0.status'));

        $search = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/transport/rides?search=' . urlencode('Kotoka'))->assertOk();
        $this->assertCount(1, $search->json('data'));
        $this->assertSame('completed', $search->json('data.0.status'));

        $byRider = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/transport/rides?search=' . urlencode('Serwaa'))->assertOk();
        $this->assertSame(3, $byRider->json('meta.total'));

        // Invalid status is rejected by validation.
        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/transport/rides?status=teleported')->assertStatus(422);
    }

    public function test_admin_can_toggle_flight_activation_and_strangers_cannot(): void
    {
        $flight = $this->makeFlight();

        $this->actingAs($this->superAdmin(), 'sanctum')
            ->putJson("/api/admin/transport/flights/{$flight->id}", ['is_active' => false])
            ->assertOk()->assertJsonPath('data.is_active', false);

        $this->assertFalse($flight->fresh()->is_active);

        $plain = User::factory()->create();
        $this->actingAs($plain, 'sanctum')
            ->putJson("/api/admin/transport/flights/{$flight->id}", ['is_active' => true])
            ->assertForbidden();

        $this->assertFalse($flight->fresh()->is_active);
    }

    public function test_rider_and_driver_journey_rows_surface_in_the_admin_queue(): void
    {
        $rider = User::factory()->create();
        $driverUser = User::factory()->create();
        $driver = Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => 'Kwame Mensah',
            'phone' => '+233 24 555 0101',
            'license_number' => 'GH-DL-88014',
            'vehicle_type' => 'Toyota Corolla',
            'is_available' => true,
        ]);

        // Rider requests; driver accepts; driver completes.
        $this->actingAs($rider, 'sanctum')->postJson('/api/rides/request', [
            'pickup_address' => 'Ridge Hospital, Accra',
            'pickup_lat' => 5.5560,
            'pickup_lng' => -0.1870,
            'dropoff_address' => 'Oxford Street, Osu',
            'dropoff_lat' => 5.5560,
            'dropoff_lng' => -0.1870,
            'ride_type' => 'economy',
        ])->assertStatus(201)->assertJsonPath('data.status', 'requested');

        $rideId = Ride::latest('created_at')->first()->id;

        $this->actingAs($driverUser, 'sanctum')
            ->postJson("/api/rides/{$rideId}/accept")->assertOk();
        $this->actingAs($driverUser, 'sanctum')
            ->postJson("/api/rides/{$rideId}/complete", ['fare' => 25])
            ->assertOk();

        $admin = $this->superAdmin();
        $queue = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/transport/rides?status=completed')->assertOk();
        $row = collect($queue->json('data'))->firstWhere('id', $rideId);

        $this->assertNotNull($row);
        $this->assertSame('Ridge Hospital, Accra', $row['pickup_address']);
        $this->assertSame($rider->name, $row['rider_name']);
        $this->assertSame(25.0, (float) $row['fare']);
    }
}
