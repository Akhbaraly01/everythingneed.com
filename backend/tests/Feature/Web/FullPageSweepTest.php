<?php

namespace Tests\Feature\Web;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Every GET web page in the app must resolve for the right audience and
 * never blow up: guests see public pages or a login redirect, signed-in
 * users see their pages or a redirect, and admins reach the console.
 * Anything that 500s here is a page the navigation promises but the
 * server cannot render.
 */
class FullPageSweepTest extends TestCase
{
    use RefreshDatabase;

    /** @return list<string> concrete URIs (route params filled with dummies) */
    private function webGetUris(): array
    {
        $skip = ['sanctum/csrf-cookie', 'up', 'livewire/update', 'livewire/preview-file'];
        $uris = [];
        foreach (Route::getRoutes() as $route) {
            if (! in_array('GET', $route->methods(), true)) {
                continue;
            }
            $uri = $route->uri();
            if (str_starts_with($uri, 'api/')) {
                continue;
            }
            if (str_contains($uri, '_ignition') || str_contains($uri, 'broadcasting')) {
                continue;
            }
            if (in_array($uri, $skip, true)) {
                continue;
            }
            $uris[] = $this->fillParams($uri);
        }
        $uris = array_values(array_unique($uris));
        sort($uris);

        return $uris;
    }

    private function fillParams(string $uri): string
    {
        return (string) preg_replace_callback('/\{([^}]+)\}/', function (array $m): string {
            $name = strtolower(trim($m[1], '?'));
            if (str_contains($name, 'slug')) {
                return 'no-such-slug';
            }
            if (str_contains($name, 'specialty') || str_contains($name, 'category') || str_contains($name, 'type')) {
                return 'no-such-thing';
            }
            if (str_contains($name, 'date')) {
                return '2026-01-01';
            }

            return (string) Str::uuid();
        }, $uri);
    }

    private function assertNone500(string $context, callable $call): void
    {
        $failures = [];
        $count = 0;
        foreach ($this->webGetUris() as $uri) {
            $count++;
            $res = $call('/' . ltrim($uri, '/'));
            if ($res->getStatusCode() >= 500) {
                $failures[] = "{$uri} => {$res->getStatusCode()}";
            }
        }
        $this->assertSame(
            [],
            $failures,
            "{$context}: {$count} pages swept, these 500:\n" . implode("\n", $failures)
        );
    }

    public function test_guest_sweep_every_public_page_resolves_or_redirects(): void
    {
        $this->assertNone500('guest', fn (string $url) => $this->get($url));
    }

    public function test_user_sweep_every_page_resolves_redirects_or_denies(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'web');
        $this->assertNone500('user', fn (string $url) => $this->get($url));
    }

    public function test_admin_sweep_every_console_page_resolves(): void
    {
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'web');
        $this->assertNone500('super_admin', fn (string $url) => $this->get($url));
    }

    public function test_plain_users_are_bounced_off_every_admin_page(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'web');

        $denied = [];
        foreach ($this->webGetUris() as $uri) {
            if (! str_starts_with($uri, 'admin/') && $uri !== 'permissions') {
                continue;
            }
            $res = $this->get('/' . $uri);
            // Web 403s render as bounce-back with an error flash (never a
            // 200, never a 500).
            if ($res->getStatusCode() === 200) {
                $denied[] = "{$uri} rendered 200 for a plain user";
            }
            if ($res->getStatusCode() >= 500) {
                $denied[] = "{$uri} => {$res->getStatusCode()}";
            }
        }
        $this->assertSame([], $denied, "Admin pages leaking to plain users:\n" . implode("\n", $denied));
    }
}
