<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforces the granular RBAC matrix seeded by PermissionSeeder.
 *
 * Usage:
 *  - permission:vendors.vendors.approve          exact permission
 *  - permission:a.b.c,d.e.f.g                    OR (router comma-splits params)
 *  - permission:a.b.c&d.e.f.g                    AND within one requirement
 *  - permission:orders.*                         wildcard: any catalog entry
 *                                                under the orders. prefix
 *
 * super_admin implicitly holds every permission (see User::hasPermission).
 * This is route-level authorization only; row-level narrowing (OWN/VENDOR/
 * DOMAIN) is enforced separately via ScopeContext/ScopeFilter (W1.6).
 */
class EnsureUserHasPermission
{
    public function handle(Request $request, Closure $next, string ...$requirements): Response
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

        foreach ($requirements as $requirement) {
            if ($this->satisfies($user, $requirement)) {
                return $next($request);
            }
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Forbidden',
                'error' => 'Missing required permission: '.implode(' or ', $requirements),
            ], 403);
        }

        // Web requests get the standard Laravel 403 error page, not raw JSON.
        abort(403, 'Missing required permission: '.implode(' or ', $requirements));
    }

    /**
     * One requirement: '&' joins tokens that must ALL pass; separate
     * requirements (router params) pass if ANY passes.
     */
    private function satisfies(User $user, string $requirement): bool
    {
        foreach (explode('&', $requirement) as $token) {
            if (! $this->satisfiesToken($user, trim($token))) {
                return false;
            }
        }

        return true;
    }

    private function satisfiesToken(User $user, string $token): bool
    {
        if ($token === '') {
            return false;
        }

        if (str_ends_with($token, '.*')) {
            // Wildcard: match against the canonical catalog so the check
            // still routes through hasPermission (role matrix ∪ user grants).
            $prefix = substr($token, 0, -1); // keep the trailing dot

            foreach (\Database\Seeders\PermissionSeeder::CATALOG as $candidate) {
                if (str_starts_with($candidate, $prefix) && $user->hasPermission($candidate)) {
                    return true;
                }
            }

            return false;
        }

        return $user->hasPermission($token);
    }
}
