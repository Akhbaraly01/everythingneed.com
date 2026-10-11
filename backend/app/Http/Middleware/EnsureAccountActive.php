<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Suspended accounts lose access immediately on top of the login-time
 * blocks (LoginUser / WebAuthController) and the token + session purge
 * performed by UserAdminService::suspend(). This is belt and braces for
 * stateful sessions that were already open when the suspension landed.
 */
class EnsureAccountActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && $user->suspended_at !== null) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'This account has been suspended. Contact support for assistance.',
                ], 403);
            }

            auth('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'This account has been suspended. Contact support for assistance.',
            ]);
        }

        return $next($request);
    }
}
