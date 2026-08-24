<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

/**
 * Route-independent global rate limiter.
 *
 * Runs in the global stack (before routing), so it covers module routes
 * registered outside the core api group. Keyed purely on client IP.
 */
class GlobalRateLimit
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = 'global:'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 240)) {
            $retry = RateLimiter::availableIn($key);
            throw new TooManyRequestsHttpException(60, "Too many requests. Retry in {$retry}s.");
        }

        RateLimiter::hit($key, 60);

        return $next($request);
    }
}
