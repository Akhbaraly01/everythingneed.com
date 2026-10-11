<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Bill provider driver (spec 30)
    |--------------------------------------------------------------------------
    | mock   : deterministic in-process success (DEV/TEST ONLY - never production)
    | manual : records a pending purchase awaiting off-platform confirmation;
    |          an administrator later confirms it. Never succeeds by itself.
    |
    | Real bill providers are configured per deployment. An unknown driver or
    | an unconfigured provider fails safely (throw) - never a fake success.
    */
    'driver' => env('BILLS_DRIVER', 'mock'),

    // Block the unsafe mock driver outside local/testing environments.
    'allow_mock_in_production' => env('BILLS_ALLOW_MOCK_IN_PRODUCTION', false),

    // Explicit test-only failure injection (never set outside tests).
    'mock_fail' => (bool) env('BILLS_MOCK_FAIL', false),

    /*
    | Service catalog (spec 30): every service declares the countries and
    | currencies it supports, the account fields it needs, and whether it is
    | enabled. Availability is derived from this catalog - never hard-coded.
    */
    'services' => [
        'airtime' => [
            'label' => 'Airtime',
            'countries' => ['NG', 'GH', 'KE'],
            'currencies' => ['NGN', 'GHS', 'KES', 'USD'],
            'fields' => ['phone', 'network', 'amount'],
            'min_amount' => 1,
            'enabled' => true,
        ],
        'data' => [
            'label' => 'Mobile Data',
            'countries' => ['NG', 'GH', 'KE'],
            'currencies' => ['NGN', 'GHS', 'KES', 'USD'],
            'fields' => ['phone', 'network', 'plan', 'amount'],
            'min_amount' => 1,
            'enabled' => true,
        ],
        'electricity' => [
            'label' => 'Electricity',
            'countries' => ['NG', 'GH'],
            'currencies' => ['NGN', 'GHS', 'USD'],
            'fields' => ['meter_number', 'disco', 'meter_type', 'amount'],
            'min_amount' => 1,
            'enabled' => true,
        ],
        'internet' => [
            'label' => 'Internet',
            'countries' => ['NG', 'GH', 'KE'],
            'currencies' => ['NGN', 'GHS', 'KES', 'USD'],
            'fields' => ['account_id', 'provider', 'plan', 'amount'],
            'min_amount' => 1,
            'enabled' => true,
        ],
        'tv' => [
            'label' => 'TV Subscription',
            'countries' => ['NG', 'GH', 'KE'],
            'currencies' => ['NGN', 'GHS', 'KES', 'USD'],
            'fields' => ['smartcard_number', 'provider', 'package', 'amount'],
            'min_amount' => 1,
            'enabled' => true,
        ],
    ],
];
