<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Payment driver
    |--------------------------------------------------------------------------
    | mock   : deterministic in-process success (DEV/TEST ONLY — never production)
    | manual : records a pending payment awaiting off-platform confirmation;
    |          an administrator later marks it succeeded (bank transfer, cash).
    |
    | Production gateways (Stripe/PayPal adapters) implement the same
    | PaymentGatewayInterface contract and register under new drivers.
    */
    'driver' => env('PAYMENTS_DRIVER', 'mock'),

    // Block the unsafe mock driver outside local/testing environments.
    'allow_mock_in_production' => env('PAYMENTS_ALLOW_MOCK_IN_PRODUCTION', false),

    'platform_fee_percent' => env('PLATFORM_FEE_PERCENT', 10),
];
