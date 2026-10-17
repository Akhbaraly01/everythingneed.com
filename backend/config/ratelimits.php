<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Mutation rate limits (Phase 5)
    |--------------------------------------------------------------------------
    |
    | Second-layer limiter for state-changing API traffic. Reads stay on the
    | generous global/api buckets; POST/PUT/PATCH/DELETE under /api/* share
    | this tighter per-actor window on top of any route-explicit throttle.
    */
    'mutations_per_minute' => (int) env('RATELIMIT_MUTATIONS', 120),
    'mutations_window_seconds' => 60,
];
