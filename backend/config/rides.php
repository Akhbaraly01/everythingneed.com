<?php

return [
    /*
    | Fare estimate model (N-38). Estimates only — the driver confirms the
    | final fare on completion. Multipliers scale the economy base rate.
    */
    'base_fare' => env('RIDES_BASE_FARE', 2.50),
    'per_km' => env('RIDES_PER_KM', 1.20),
    'per_minute' => env('RIDES_PER_MINUTE', 0.25),
    'city_speed_kmh' => env('RIDES_CITY_SPEED_KMH', 25),
    'estimate_band' => env('RIDES_ESTIMATE_BAND', 0.15), // ±15% shown to riders
    'currency' => env('RIDES_CURRENCY', 'USD'),
    'multipliers' => [
        'economy' => 1.0,
        'comfort' => 1.5,
        'premium' => 2.0,
    ],
];
