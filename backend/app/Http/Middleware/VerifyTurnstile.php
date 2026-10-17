<?php

namespace App\Http\Middleware;

use Closure;
use Core\Services\TurnstileVerifier;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Phase 5: bot defence on auth endpoints (register/login/reset).
 *
 * Reads the Turnstile token from `cf-turnstile-response` (Cloudflare
 * default) or `turnstile_token`. Inactive without TURNSTILE_SECRET
 * (local/test/dev keep working); enforced wherever the secret exists.
 */
class VerifyTurnstile
{
    public function handle(Request $request, Closure $next): Response
    {
        $verifier = app(TurnstileVerifier::class);

        if (!$verifier->configured()) {
            return $next($request);
        }

        $token = $request->input('cf-turnstile-response') ?? $request->input('turnstile_token');

        if (!$verifier->verify(is_string($token) ? $token : null, $request->ip())) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Bot verification failed. Please try again.',
                ], 422);
            }

            return redirect()->back()->withInput($request->except('password', 'password_confirmation'))->with('error', 'Bot verification failed. Please try again.');
        }

        return $next($request);
    }
}
