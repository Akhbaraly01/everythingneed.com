<?php

namespace Tests\Feature\Admin;

use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W1.7 — EnsureUserHasPermission expansion:
 *  - exact permission tokens
 *  - OR across comma-split router params
 *  - AND within one requirement ('&')
 *  - wildcard 'prefix.*' matched against the canonical catalog
 *  - guests 401, denials 403 JSON with a helpful error
 *  - per-user grants (W1.5) feed the middleware through hasPermission.
 */
class PermissionMiddlewareTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    private function guard(string $uri, string $middleware): void
    {
        Route::get($uri, fn () => response()->json(['ok' => true]))
            ->middleware(['auth:sanctum', $middleware]);
    }

    #[Test]
    public function test_exact_permission_allows_denies_and_rejects_guests(): void
    {
        $this->guard('/api/_pm/exact', 'permission:orders.orders.view');

        // Guest first, before any actingAs.
        $this->getJson('/api/_pm/exact')->assertStatus(401);

        $holder = $this->createUser();
        $this->assignRole($holder, 'orders_admin');
        $this->actingAs($holder, 'sanctum')
            ->getJson('/api/_pm/exact')
            ->assertOk();

        $missing = $this->createUser();
        $this->assignRole($missing, 'support_admin');
        $this->actingAs($missing, 'sanctum')
            ->getJson('/api/_pm/exact')
            ->assertStatus(403)
            ->assertJsonPath('error', 'Missing required permission: orders.orders.view');
    }

    #[Test]
    public function test_comma_params_are_ored(): void
    {
        $this->guard('/api/_pm/or', 'permission:products.products.view,orders.orders.view');

        $orders = $this->createUser();
        $this->assignRole($orders, 'orders_admin');
        $this->actingAs($orders, 'sanctum')->getJson('/api/_pm/or')->assertOk();

        $products = $this->createUser();
        $this->assignRole($products, 'marketplace_admin');
        $this->actingAs($products, 'sanctum')->getJson('/api/_pm/or')->assertOk();

        $neither = $this->createUser();
        $this->assignRole($neither, 'support_admin');
        $this->actingAs($neither, 'sanctum')->getJson('/api/_pm/or')->assertStatus(403);
    }

    #[Test]
    public function test_ampersand_requires_all_tokens_and_user_grants_count(): void
    {
        $this->guard('/api/_pm/and', 'permission:products.products.view&orders.orders.view');

        $partial = $this->createUser();
        $this->assignRole($partial, 'orders_admin');
        $this->actingAs($partial, 'sanctum')->getJson('/api/_pm/and')->assertStatus(403);

        // A per-user grant (W1.5) completes the AND requirement.
        app(\Core\Services\Contracts\PermissionServiceInterface::class)
            ->grantUserPermission($partial->id, 'products.products.view');

        $this->actingAs($partial, 'sanctum')->getJson('/api/_pm/and')->assertOk();

        // Both tokens via roles also passes (moderator holds both after the
        // W1.7 matrix reconciliation).
        $both = $this->createUser();
        $this->assignRole($both, 'moderator');
        $this->actingAs($both, 'sanctum')->getJson('/api/_pm/and')->assertOk();
    }

    #[Test]
    public function test_wildcard_matches_any_catalog_permission_under_prefix(): void
    {
        $this->guard('/api/_pm/wild', 'permission:orders.*');

        $orders = $this->createUser();
        $this->assignRole($orders, 'orders_admin');
        $this->actingAs($orders, 'sanctum')->getJson('/api/_pm/wild')->assertOk();

        $noOrders = $this->createUser();
        $this->assignRole($noOrders, 'security_admin');
        $this->actingAs($noOrders, 'sanctum')->getJson('/api/_pm/wild')->assertStatus(403);

        // Wildcard is prefix-scoped: unrelated domains do not satisfy it
        // (healthcare_admin holds zero orders.* permissions).
        $other = $this->createUser();
        $this->assignRole($other, 'healthcare_admin');
        $this->actingAs($other, 'sanctum')->getJson('/api/_pm/wild')->assertStatus(403);
    }

    #[Test]
    public function test_super_admin_satisfies_exact_and_wildcard_tokens(): void
    {
        $this->guard('/api/_pm/super', 'permission:settings.system.update&analytics.*');

        $super = $this->createAdmin();
        $this->actingAs($super, 'sanctum')->getJson('/api/_pm/super')->assertOk();
    }
}
