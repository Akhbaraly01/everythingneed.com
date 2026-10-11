<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Payment driver
    |--------------------------------------------------------------------------
    | mock    : deterministic in-process success (DEV/TEST ONLY — never production)
    | manual  : records a pending payment awaiting off-platform confirmation;
    |           an administrator later marks it succeeded (bank transfer, cash).
    | stripe  : Core/Services/Gateways/StripeGatewayDriver (requires secret)
    | paypal  : Core/Services/Gateways/PayPalGatewayDriver (requires client/secret)
    | paystack: Core/Services/Gateways/PaystackGatewayDriver (requires secret)
    |
    | All drivers implement GatewayDriverInterface / PaymentGatewayInterface.
    */
    'driver' => env('PAYMENTS_DRIVER', 'mock'),

    // Block the unsafe mock driver outside local/testing environments.
    'allow_mock_in_production' => env('PAYMENTS_ALLOW_MOCK_IN_PRODUCTION', false),

    'platform_fee_percent' => env('PLATFORM_FEE_PERCENT', 10),

    'stripe' => [
        // PAYMENTS_* names (documented in .env.production.example) win;
        // bare STRIPE_* names stay supported for existing local setups.
        'secret' => env('PAYMENTS_STRIPE_SECRET', env('STRIPE_SECRET', '')),
        'publishable' => env('PAYMENTS_STRIPE_PUBLISHABLE', env('STRIPE_PUBLISHABLE', '')),
        'webhook_secret' => env('PAYMENTS_STRIPE_WEBHOOK_SECRET', env('STRIPE_WEBHOOK_SECRET', '')),
    ],

    'paypal' => [
        'client_id' => env('PAYMENTS_PAYPAL_CLIENT_ID', env('PAYPAL_CLIENT_ID', '')),
        'secret' => env('PAYMENTS_PAYPAL_SECRET', env('PAYPAL_SECRET', '')),
        'sandbox' => (bool) env('PAYMENTS_PAYPAL_SANDBOX', env('PAYPAL_SANDBOX', true)),
        'webhook_id' => env('PAYMENTS_PAYPAL_WEBHOOK_ID', env('PAYPAL_WEBHOOK_ID', '')),
        'access_token' => env('PAYMENTS_PAYPAL_ACCESS_TOKEN', env('PAYPAL_ACCESS_TOKEN', '')),
    ],

    'paystack' => [
        'secret' => env('PAYMENTS_PAYSTACK_SECRET', env('PAYSTACK_SECRET', '')),
        'public' => env('PAYMENTS_PAYSTACK_PUBLIC', env('PAYSTACK_PUBLIC', '')),
    ],
];
