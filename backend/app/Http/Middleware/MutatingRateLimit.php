<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Phase 5: method-aware second layer for state-changing API traffic.
 *
 * Runs in the global stack (module routes register outside the core api
 * group) but only engages POST/PUT/PATCH/DELETE under /api/* — reads keep
 * the generous global/api buckets. Keyed per authenticated user, falling
 * back to IP for guests, so one abusive actor cannot spend the shared
 * budget. Route-explicit `throttle:` rules still apply on top.
 */
class MutatingRateLimit
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethodCacheable() || $request->isMethod('OPTIONS') || !$request->is('api/*')) {
            return $next($request);
        }

        $limit = max(1, (int) config('ratelimits.mutations_per_minute', 120));
        $window = max(1, (int) config('ratelimits.mutations_window_seconds', 60));
        $key = 'mutations:' . ($request->user()?->id ?? $request->ip());

        if (RateLimiter::tooManyAttempts($key, $limit)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'message' => 'Too many requests. Please try again in ' . $seconds . ' seconds.',
            ], 429)->withHeaders([
                'Retry-After' => $seconds,
                'X-RateLimit-Remaining' => 0,
            ]);
        }

        RateLimiter::hit($key, $window);

        $response = $next($request);

        return $response->withHeaders([
            'X-RateLimit-Remaining' => RateLimiter::remaining($key, $limit),
        ]);
    }
}
