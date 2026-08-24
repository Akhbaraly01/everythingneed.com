<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_map('trim', explode(',', env('FRONTEND_URLS', 'http://localhost:8080,http://127.0.0.1:8080'))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Accept', 'Authorization', 'X-CSRF-TOKEN'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => true,
];
