<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforces the granular RBAC matrix seeded by PermissionSeeder.
 * Usage: ->middleware('permission:vendors.approve')
 * super_admin implicitly holds every permission (see User::hasPermission).
 */
class EnsureUserHasPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Unauthenticated'], 401)
                : redirect()->route('login');
        }

        foreach ($permissions as $permission) {
            if ($user->hasPermission($permission)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Forbidden',
            'error' => 'Missing required permission: '.implode(' or ', $permissions),
        ], 403);
    }
}
