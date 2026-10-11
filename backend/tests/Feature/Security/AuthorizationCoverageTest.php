<?php

namespace Tests\Feature\Security;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * W8 (S-03): authorization coverage sweep pinned as a test.
 *
 * Rules:
 *  1. Every mutating (POST/PUT/PATCH/DELETE) route under api/admin is
 *     gated by role / permission / can (Gate) middleware.
 *  2. Every other mutating api route is authenticated, except a strict
 *     allowlist of intentionally public endpoints (auth flows, payment
 *     webhooks, newsletter, throttled AI assistant).
 *  3. Guest hits on a role-gated admin route answer 401 (no silent pass).
 */
class AuthorizationCoverageTest extends TestCase
{
    private const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];

    /** Intentionally public mutating endpoints (uri patterns, {param} wildcards). */
    private const PUBLIC_ALLOWLIST = [
        'api/auth/*',
        'api/newsletter/subscribe',
        'api/webhooks/*',
        'api/ai/chat',
        // Guest suspension appeals: throttled 3/min, validated, generic
        // response (never discloses account existence).
        'api/appeals',
        // Public CMS form submissions (spec 106): throttled 10/min,
        // validated against the published form's schema - guests submit
        // lead/contact forms straight from rendered pages.
        'api/forms/*/submit',
    ];

    private function isMutating($route): bool
    {
        foreach ($route->methods() as $method) {
            if (in_array($method, self::MUTATING, true)) {
                return true;
            }
        }

        return false;
    }

    private function middlewareOf($route): string
    {
        return implode(',', $route->gatherMiddleware());
    }

    private function isAuthorized(string $middleware): bool
    {
        return preg_match('/role:|permission:|can:|EnsureUserHasRole|EnsureUserHasPermission|Authorize/i', $middleware) === 1;
    }

    private function isPublic(string $uri): bool
    {
        foreach (self::PUBLIC_ALLOWLIST as $pattern) {
            $regex = '#^'.str_replace('\*', '.*', preg_quote($pattern, '#')).'$#';
            if (preg_match($regex, $uri) === 1) {
                return true;
            }
        }

        return false;
    }

    public function test_admin_mutating_routes_all_have_authorization_gates(): void
    {
        $offenders = [];
        foreach (Route::getRoutes() as $route) {
            if (!$this->isMutating($route)) {
                continue;
            }
            $uri = $route->uri();
            if (!str_starts_with($uri, 'api/admin/')) {
                continue;
            }
            if (!$this->isAuthorized($this->middlewareOf($route))) {
                $offenders[] = $route->methods()[0].' '.$uri;
            }
        }

        $this->assertSame([], $offenders, 'Admin mutating routes without role/permission gate: '.implode(', ', $offenders));
    }

    public function test_user_plane_mutating_routes_are_authenticated_or_allowlisted(): void
    {
        $offenders = [];
        foreach (Route::getRoutes() as $route) {
            if (!$this->isMutating($route)) {
                continue;
            }
            $uri = $route->uri();
            if (!str_starts_with($uri, 'api/') || str_starts_with($uri, 'api/admin/')) {
                continue;
            }
            $middleware = $this->middlewareOf($route);
            $authenticated = preg_match('/auth:|Authenticate|EnsureUserHasRole|EnsureUserHasPermission/i', $middleware) === 1
                || $this->isAuthorized($middleware);
            if ($authenticated || $this->isPublic($uri)) {
                continue;
            }
            $offenders[] = $route->methods()[0].' '.$uri;
        }

        $this->assertSame([], $offenders, 'Mutating api routes neither authenticated nor allowlisted: '.implode(', ', $offenders));
    }

    public function test_guest_hits_on_role_gated_admin_routes_answer_401(): void
    {
        // EnsureUserHasRole routes are not behind auth:sanctum, but the
        // middleware itself must 401 guests rather than pass through.
        $this->postJson('/api/admin/hotels', [])
            ->assertStatus(401);

        $this->putJson('/api/admin/jobs/some-id', [])
            ->assertStatus(401);
    }
}
