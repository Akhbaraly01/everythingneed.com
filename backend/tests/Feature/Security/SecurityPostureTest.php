<?php

namespace Tests\Feature\Security;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Phase 1 hardening pins: QR secrets never leave the server, health/error
 * responses carry no internals, and every auth session/token route has an
 * explicit throttle (not just the global limiter).
 */
class SecurityPostureTest extends TestCase
{
    public function test_qr_code_is_rendered_in_process_never_via_third_party(): void
    {
        $user = $this->actingAsUser();

        $res = $this->postJson('/api/auth/2fa/enable');

        $res->assertOk();
        $url = (string) $res->json('data.qr_code_url');
        $this->assertStringStartsWith('data:image/svg+xml;base64,', $url);
        $this->assertStringNotContainsString('qrserver', $url);
        $this->assertStringNotContainsString('http', $url);
        $this->assertNotEmpty($res->json('data.secret'));
        $this->assertNotSame($user->id, $res->json('data.secret'));
    }

    public function test_health_probe_is_minimal_and_redacted(): void
    {
        $res = $this->getJson('/up');

        $res->assertOk()
            ->assertJsonPath('status', 'operational')
            ->assertJsonPath('database', 'ok');

        $payload = $res->json();
        foreach (['version', 'php', 'environment', 'cache', 'session', 'queue', 'app_url'] as $key) {
            $this->assertArrayNotHasKey($key, $payload, "Fingerprint key leaked: {$key}");
        }
    }

    public function test_api_errors_are_redacted_without_production_debug(): void
    {
        config(['app.debug' => false]);

        $this->getJson('/api/definitely-not-a-route')
            ->assertNotFound()
            ->assertJsonPath('error', 'The requested resource was not found.');
    }

    public function test_every_auth_session_route_has_an_explicit_throttle(): void
    {
        $routes = Route::getRoutes();

        $targets = [
            ['POST', 'api/auth/logout'],
            ['GET', 'api/auth/user'],
            ['GET', 'api/auth/me'],
            ['GET', 'api/auth/session'],
            ['GET', 'api/auth/tokens'],
            ['DELETE', 'api/auth/tokens/{id}'],
            ['DELETE', 'api/auth/tokens'],
        ];

        foreach ($targets as [$method, $uri]) {
            $route = $routes->getRoutesByMethod()[$method] ?? [];
            $match = null;
            foreach ($route as $candidate) {
                if ($candidate->uri() === $uri) {
                    $match = $candidate;
                    break;
                }
            }

            $this->assertNotNull($match, "Route missing: {$method} {$uri}");
            $hasThrottle = collect($match->gatherMiddleware())->contains(
                fn ($m) => is_string($m) && str_starts_with($m, 'throttle:')
            );
            $this->assertTrue($hasThrottle, "No explicit throttle: {$method} {$uri}");
        }
    }
}
