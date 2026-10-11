<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\Rides\Entities\Driver;
use Modules\Rides\Entities\Ride;

/**
 * W6: transport demo vertical. Registers two local drivers (Kwame/Ama,
 * Accra) and seeds one ride per lifecycle status (requested, accepted,
 * in_progress, completed, cancelled) for the canonical customer account
 * so the admin transport console and rider pages have real rows.
 * Idempotent: drivers keyed by email, rides skipped when demo rows exist.
 */
class TransportDemoSeeder extends Seeder
{
    public function run(): void
    {
        $kwame = $this->driverUser(
            'kwame.driver@everythingneed.com',
            'Kwame Mensah',
            ['full_name' => 'Kwame Mensah', 'phone' => '+233 24 555 0101', 'license_number' => 'GH-DL-88014', 'vehicle_type' => 'Toyota Corolla', 'is_available' => true, 'rating' => 4.8, 'total_rides' => 3, 'latitude' => 5.6037, 'longitude' => -0.1870]
        );
        $ama = $this->driverUser(
            'ama.driver@everythingneed.com',
            'Ama Owusu',
            ['full_name' => 'Ama Owusu', 'phone' => '+233 20 555 0202', 'license_number' => 'GH-DL-88015', 'vehicle_type' => 'Hyundai i10', 'is_available' => false, 'rating' => 4.9, 'total_rides' => 2, 'latitude' => 5.6050, 'longitude' => -0.1825]
        );

        if (Ride::where('pickup_address', 'like', 'DEMO:%')->exists()) {
            return;
        }

        $rider = User::where('email', 'customer@everythingneed.com')->first();
        if ($rider === null) {
            return;
        }

        $now = now();
        $specs = [
            ['status' => 'requested', 'driver' => null, 'days' => 0, 'fare' => null, 'pickup' => 'DEMO: Kotoka International Airport, Terminal 3', 'dropoff' => 'DEMO: Oxford Street, Osu', 'km' => 8.2, 'mins' => 22],
            ['status' => 'accepted', 'driver' => $kwame, 'days' => 0, 'fare' => null, 'pickup' => 'DEMO: Ridge Hospital, Accra', 'dropoff' => 'DEMO: Makola Market', 'km' => 3.6, 'mins' => 14],
            ['status' => 'in_progress', 'driver' => $kwame, 'days' => 1, 'fare' => 32.50, 'pickup' => 'DEMO: East Legon, Accra', 'dropoff' => 'DEMO: Independence Square', 'km' => 11.4, 'mins' => 30],
            ['status' => 'completed', 'driver' => $ama, 'days' => 3, 'fare' => 45.00, 'pickup' => 'DEMO: Osu Castle Junction', 'dropoff' => 'DEMO: Achimota Retail Centre', 'km' => 12.4, 'mins' => 28],
            ['status' => 'cancelled', 'driver' => $kwame, 'days' => 2, 'fare' => null, 'pickup' => 'DEMO: Spintex Road, Batsonaa', 'dropoff' => 'DEMO: Tema Station', 'km' => 6.9, 'mins' => 18],
        ];

        foreach ($specs as $i => $spec) {
            Ride::create([
                'user_id' => $rider->id,
                'driver_id' => $spec['driver']?->id,
                'pickup_address' => $spec['pickup'],
                'pickup_lat' => 5.6037 + ($i * 0.004),
                'pickup_lng' => -0.1870 - ($i * 0.004),
                'dropoff_address' => $spec['dropoff'],
                'dropoff_lat' => 5.5560 + ($i * 0.003),
                'dropoff_lng' => -0.1960 - ($i * 0.003),
                'status' => $spec['status'],
                'fare' => $spec['fare'],
                'currency' => 'GHS',
                'distance_km' => $spec['km'],
                'duration_minutes' => $spec['mins'],
                'started_at' => in_array($spec['status'], ['in_progress', 'completed'], true) ? $now->copy()->subDays($spec['days'])->addMinutes(4) : null,
                'completed_at' => $spec['status'] === 'completed' ? $now->copy()->subDays($spec['days']) : null,
                'created_at' => $now->copy()->subDays($spec['days']),
                'updated_at' => $now->copy()->subDays($spec['days']),
            ]);
        }
    }

    /** Driver user + Driver profile, keyed by email (password: password). */
    private function driverUser(string $email, string $name, array $driver): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make('password'), 'email_verified_at' => now()]
        );

        Driver::firstOrCreate(['user_id' => $user->id], $driver);

        return $user;
    }
}
