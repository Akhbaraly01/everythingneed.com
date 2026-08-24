<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimiter
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $this->resolveRequestSignature($request);

        if (RateLimiter::tooManyAttempts($key, 60)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'message' => 'Too many requests. Please try again in ' . $seconds . ' seconds.',
            ], 429)->withHeaders([
                'Retry-After' => $seconds,
                'X-RateLimit-Remaining' => 0,
            ]);
        }

        RateLimiter::hit($key, 60);

        $response = $next($request);

        return $response->withHeaders([
            'X-RateLimit-Remaining' => RateLimiter::remaining($key, 60),
        ]);
    }

    protected function resolveRequestSignature(Request $request): string
    {
        if ($user = $request->user()) {
            return 'user_' . $user->id;
        }

        return $request->ip();
    }
}
