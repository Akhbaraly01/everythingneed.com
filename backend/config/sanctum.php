<?php

use Laravel\Sanctum\Sanctum;

return [
    // Same-origin (stateful) domains. The app's own URL host:port is ALWAYS
    // merged in - without it every cookie-authenticated /api/* call is treated
    // as cross-site (no session started) and 401s. env() may add more;
    // entries are trimmed and deduped. Single app: everything on :8000.
    'stateful' => array_values(array_unique(array_filter(array_map('trim', explode(',', sprintf(
        '%s,%s',
        env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:8000,127.0.0.1,127.0.0.1:8000,::1'),
        Sanctum::currentApplicationUrlWithPort()
    )))))),

    'guard' => ['web'],

    'expiration' => 480, // 8 hours

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
