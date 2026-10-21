<?php

return [
    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'video' => [
        'provider' => env('VIDEO_PROVIDER', 'jitsi'),
        'base_url' => env('VIDEO_BASE_URL', ''),
    ],

    'ai' => [
        'gateway_url' => env('AI_GATEWAY_URL', ''),
        'api_key' => env('AI_API_KEY', ''),
        'model' => env('AI_MODEL', ''),
    ],

    // Phase 5: Cloudflare Turnstile bot defence on auth endpoints. Unset
    // secret = verification skipped (logged); production MUST set both keys.
    'turnstile' => [
        'secret' => env('TURNSTILE_SECRET', ''),
        'site_key' => env('TURNSTILE_SITE_KEY', ''),
        // Whether the bot defence MUST be active. Null = "required in
        // production, skipped in local/test/dev". Set TURNSTILE_REQUIRED
        // to force the behaviour either way.
        'required' => env('TURNSTILE_REQUIRED') === null
            ? null
            : filter_var(env('TURNSTILE_REQUIRED'), FILTER_VALIDATE_BOOLEAN),
    ],
];
