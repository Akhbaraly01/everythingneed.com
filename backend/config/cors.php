<?php

$origins = array_values(array_filter(array_map(
    'trim',
    explode(',', env('FRONTEND_URLS', 'http://localhost:8000,http://127.0.0.1:8000')),
)));

// Never allow wildcard origins when credentials are supported.
if ($origins === [] || in_array('*', $origins, true)) {
    $origins = ['http://localhost:8000', 'http://127.0.0.1:8000'];
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Accept', 'Authorization', 'X-CSRF-TOKEN'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => true,
];
