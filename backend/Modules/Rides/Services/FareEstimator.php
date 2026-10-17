<?php

namespace Modules\Rides\Services;

/**
 * N-38 fare estimate: haversine distance + config-driven rates, returned
 * as a ±band range. Estimates only — the driver confirms the final fare
 * on completion; this class never persists a price.
 */
class FareEstimator
{
    /**
     * @return array{distance_km: float, duration_minutes: int, fare_min: float, fare_max: float, currency: string, ride_type: string}
     */
    public static function estimate(
        float $pickupLat,
        float $pickupLng,
        float $dropoffLat,
        float $dropoffLng,
        string $rideType = 'economy',
    ): array {
        $distanceKm = self::haversineKm($pickupLat, $pickupLng, $dropoffLat, $dropoffLng);
        $speed = max(1, (float) config('rides.city_speed_kmh', 25));
        $durationMinutes = (int) ceil(($distanceKm / $speed) * 60);

        $multipliers = config('rides.multipliers', []);
        $multiplier = (float) ($multipliers[$rideType] ?? ($multipliers['economy'] ?? 1.0));

        $fare = ((float) config('rides.base_fare', 2.5)
            + $distanceKm * (float) config('rides.per_km', 1.2)
            + $durationMinutes * (float) config('rides.per_minute', 0.25)) * $multiplier;

        $band = (float) config('rides.estimate_band', 0.15);

        return [
            'distance_km' => round($distanceKm, 2),
            'duration_minutes' => $durationMinutes,
            'fare_min' => round($fare * (1 - $band), 2),
            'fare_max' => round($fare * (1 + $band), 2),
            'currency' => (string) config('rides.currency', 'USD'),
            'ride_type' => $rideType,
        ];
    }

    /** Great-circle distance in kilometres. */
    public static function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371.0;

        $dLatDeg = deg2rad($lat2 - $lat1);
        $dLngDeg = deg2rad($lng2 - $lng1);

        $a = sin($dLatDeg / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLngDeg / 2) ** 2;

        return 2 * $earthRadiusKm * asin(min(1.0, sqrt($a)));
    }
}
