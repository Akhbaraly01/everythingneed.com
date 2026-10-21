<?php

namespace App\Http\Middleware;

use Closure;
use Core\Services\Contracts\WorkspaceResolverInterface;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Entry gate for the administration console landing pages.
 *
 * The domain pages are guarded by granular `permission:` middleware. The
 * dashboard/root cannot declare one catalog permission because the seeded
 * console roles hold different slices of the matrix, and custom roles are
 * not named in any `role:` list at all. This gate therefore accepts either:
 *
 *  - a role listed in config('workspace.admin_console_roles'), or
 *  - any user whose effective permissions open at least one permission-gated
 *    /admin route (the same registry that already drives the sidebar).
 *
 * Every other /admin page keeps its own permission gate; this middleware
 * only decides who may enter the console shell.
 */
class EnsureAdminConsoleAccess
{
    public function __construct(private WorkspaceResolverInterface $workspace) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Unauthenticated'], 401)
                : redirect()->guest(route('login'));
        }

        if ($user->suspended_at !== null) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'This account has been suspended. Contact support for assistance.'], 403)
                : redirect()->route('login')->withErrors(['email' => 'This account has been suspended. Contact support for assistance.']);
        }

        $roles = $user->roles->pluck('role')->all();
        $hasConsoleRole = array_intersect(
            (array) config('workspace.admin_console_roles', []),
            $roles,
        ) !== [];

        if ($hasConsoleRole || in_array('admin', $this->workspace->availableWorkspaces($user), true)) {
            return $next($request);
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Forbidden',
                'error' => 'This account cannot access the administration console.',
            ], 403);
        }

        abort(403, 'This account cannot access the administration console.');
    }
}
