<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Unauthenticated'], 401)
                : redirect()->guest(route('login'));
        }

        if ($user->suspended_at !== null) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'This account has been suspended. Contact support for assistance.'], 403)
                : redirect()->route('login')->withErrors(['email' => 'This account has been suspended. Contact support for assistance.']);
        }

        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Forbidden',
                'error' => 'Unauthorized. Required role: '.implode(' or ', $roles),
            ], 403);
        }

        abort(403, 'Unauthorized. Required role: ' . implode(' or ', $roles));
    }
}
