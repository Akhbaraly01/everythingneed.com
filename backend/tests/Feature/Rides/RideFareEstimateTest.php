<?php

namespace Tests\Feature\Rides;

use Tests\TestCase;

/**
 * N-38 fare estimate: public, stateless, banded range; never persists.
 */
class RideFareEstimateTest extends TestCase
{
    private const NYC = ['lat' => 40.7128, 'lng' => -74.0060];
    private const BROOKLYN = ['lat' => 40.6782, 'lng' => -73.9442];

    public function test_estimate_returns_banded_fare_for_valid_coordinates(): void
    {
        $response = $this->getJson(sprintf(
            '/api/rides/estimate?pickup_lat=%s&pickup_lng=%s&dropoff_lat=%s&dropoff_lng=%s',
            self::NYC['lat'], self::NYC['lng'], self::BROOKLYN['lat'], self::BROOKLYN['lng'],
        ));

        $response->assertOk();
        $data = $response->json('data');
        $this->assertGreaterThan(0, $data['distance_km']);
        $this->assertGreaterThan(0, $data['duration_minutes']);
        $this->assertLessThan($data['fare_max'], $data['fare_min']);
        $this->assertSame('USD', $data['currency']);
        $this->assertSame('economy', $data['ride_type']);
        $this->assertNotEmpty($data['note']);
    }

    public function test_premium_costs_more_than_economy_for_same_route(): void
    {
        $base = sprintf(
            '/api/rides/estimate?pickup_lat=%s&pickup_lng=%s&dropoff_lat=%s&dropoff_lng=%s',
            self::NYC['lat'], self::NYC['lng'], self::BROOKLYN['lat'], self::BROOKLYN['lng'],
        );

        $economy = $this->getJson($base . '&ride_type=economy')->json('data.fare_min');
        $premium = $this->getJson($base . '&ride_type=premium')->json('data.fare_max');

        $this->assertGreaterThan($economy, $premium);
    }

    public function test_same_point_costs_less_than_longer_route(): void
    {
        $short = $this->getJson(sprintf(
            '/api/rides/estimate?pickup_lat=40.7128&pickup_lng=-74.0060&dropoff_lat=40.7138&dropoff_lng=-74.0060',
        ))->json('data.fare_max');

        $long = $this->getJson(sprintf(
            '/api/rides/estimate?pickup_lat=40.7128&pickup_lng=-74.0060&dropoff_lat=34.0522&dropoff_lng=-118.2437',
        ))->json('data.fare_max');

        $this->assertLessThan($long, $short);
    }

    public function test_invalid_coordinates_are_rejected(): void
    {
        $this->getJson('/api/rides/estimate?pickup_lat=999&pickup_lng=0&dropoff_lat=1&dropoff_lng=1')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['pickup_lat']);
    }

    public function test_invalid_ride_type_is_rejected(): void
    {
        $this->getJson('/api/rides/estimate?pickup_lat=1&pickup_lng=1&dropoff_lat=2&dropoff_lng=2&ride_type=spaceship')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['ride_type']);
    }

    public function test_estimate_requires_all_coordinates(): void
    {
        $this->getJson('/api/rides/estimate?pickup_lat=1')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['pickup_lng', 'dropoff_lat', 'dropoff_lng']);
    }

    public function test_estimate_persists_nothing(): void
    {
        $before = \DB::table('rides')->count();

        $this->getJson('/api/rides/estimate?pickup_lat=40.7&pickup_lng=-74.0&dropoff_lat=40.72&dropoff_lng=-73.99')
            ->assertOk();

        $this->assertSame($before, \DB::table('rides')->count());
    }
}
