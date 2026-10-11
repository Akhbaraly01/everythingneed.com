<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W1.6 — permission_scopes: ScopeContext resolution + ScopeFilter
 * enforcement for OWN / VENDOR / DOMAIN (active) and TEAM / COUNTRY /
 * REGION (architectured, deferred = no row narrowing).
 *
 * Scope rows are granted by super_admin through the scopes API; absence of
 * a row means global, so existing behavior is untouched until scoped.
 */
class PermissionScopeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
        \Illuminate\Support\Facades\Cache::forget('permission.scopes');
    }

    private function superAdmin(): User
    {
        $super = $this->createAdmin();
        $this->actingAs($super, 'sanctum');

        return $super;
    }

    private function grantScope(array $payload): void
    {
        $this->postJson('/api/admin/rbac/scopes', $payload)->assertStatus(201);
    }

    private function placeOrder(string $customerId, string $vendorId): string
    {
        $id = (string) Str::uuid();
        \Illuminate\Support\Facades\DB::table('vendor_orders')->insert([
            'id' => $id,
            'vendor_id' => $vendorId,
            'customer_id' => $customerId,
            'product_name' => 'Scoped Widget',
            'quantity' => 1,
            'unit_price' => 10,
            'total_price' => 10,
            'order_number' => 'SCOPE-' . Str::upper(Str::random(10)),
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    private function makeTicket(string $requesterId, ?string $departmentId): string
    {
        $id = (string) Str::uuid();
        \Illuminate\Support\Facades\DB::table('tickets')->insert([
            'id' => $id,
            'user_id' => $requesterId,
            'ticket_number' => 'TKT-' . Str::upper(Str::random(10)),
            'subject' => 'Scope subject',
            'description' => 'Scope description',
            'priority' => 'medium',
            'status' => 'open',
            'department_id' => $departmentId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    #[Test]
    public function test_scope_api_grant_list_revoke_contract(): void
    {
        $this->superAdmin();

        $this->grantScope([
            'holder_type' => 'role',
            'holder_id' => 'orders_admin',
            'permission' => 'orders.orders.view',
            'scope' => 'own',
        ]);

        $listed = $this->getJson('/api/admin/rbac/scopes')->assertOk()->json('data');
        $this->assertCount(1, $listed);
        $this->assertSame('own', $listed[0]['scope']);

        $this->deleteJson("/api/admin/rbac/scopes/{$listed[0]['id']}")->assertOk();
        $this->getJson('/api/admin/rbac/scopes')->assertOk()->assertJsonPath('data', []);
        $this->deleteJson('/api/admin/rbac/scopes/' . Str::uuid())->assertStatus(404);
    }

    #[Test]
    public function test_scope_api_validation_and_guards(): void
    {
        // Guests first, before any actingAs.
        $this->postJson('/api/admin/rbac/scopes', [
            'holder_type' => 'role',
            'holder_id' => 'orders_admin',
            'permission' => 'orders.orders.view',
            'scope' => 'own',
        ])->assertUnauthorized();

        $this->superAdmin();
        $base = [
            'holder_type' => 'role',
            'holder_id' => 'orders_admin',
            'permission' => 'orders.orders.view',
            'scope' => 'own',
        ];

        $this->postJson('/api/admin/rbac/scopes', [...$base, 'scope' => 'banana'])->assertStatus(422);
        $this->postJson('/api/admin/rbac/scopes', [...$base, 'permission' => 'made.up'])->assertStatus(422);
        $this->postJson('/api/admin/rbac/scopes', [...$base, 'holder_id' => 'not_a_role'])->assertStatus(422);
        $this->postJson('/api/admin/rbac/scopes', [...$base, 'scope' => 'domain'])
            ->assertStatus(422); // domain requires scope_value
        $this->postJson('/api/admin/rbac/scopes', [
            ...$base,
            'holder_type' => 'user',
            'holder_id' => '00000000-0000-0000-0000-000000000000',
        ])->assertStatus(422); // unknown user

        $moderator = $this->createUser();
        $this->assignRole($moderator, 'moderator');
        $this->actingAs($moderator, 'sanctum');
        $this->postJson('/api/admin/rbac/scopes', $base)->assertForbidden();
    }

    #[Test]
    public function test_own_scope_narrows_orders_list_detail_and_writes(): void
    {
        $actor = $this->createUser();
        $this->assignRole($actor, 'orders_admin');
        $stranger = $this->createUser();
        $vendorUser = $this->createVendorUser();
        $vendor = $this->createVendor($vendorUser);

        $ownOrder = $this->placeOrder($actor->id, $vendor->id);
        $otherOrder = $this->placeOrder($stranger->id, $vendor->id);

        // Unscoped: everything visible.
        $this->actingAs($actor, 'sanctum');
        $this->getJson('/api/admin/orders')->assertOk()->assertJsonPath('meta.total', 2);

        // Grant the scope as super_admin, then act as the scoped role.
        $this->superAdmin();
        $this->grantScope([
            'holder_type' => 'role',
            'holder_id' => 'orders_admin',
            'permission' => 'orders.orders.view',
            'scope' => 'own',
        ]);

        $this->actingAs($actor, 'sanctum');

        $scoped = $this->actingAs($actor, 'sanctum')->getJson('/api/admin/orders')->assertOk();
        $this->assertSame(1, $scoped->json('meta.total'));
        $this->assertSame($ownOrder, $scoped->json('data.0.id'));

        // Detail / writes on the out-of-scope row fail closed (404, non-leaking).
        $this->getJson("/api/admin/orders/{$otherOrder}")->assertStatus(404);
        $this->getJson("/api/admin/orders/{$ownOrder}")->assertOk();
        $this->putJson("/api/admin/orders/{$otherOrder}/status", ['status' => 'confirmed'])->assertStatus(404);
        $this->putJson("/api/admin/orders/{$ownOrder}/status", ['status' => 'confirmed'])->assertOk();
        $this->postJson("/api/admin/orders/{$otherOrder}/refund", ['reason' => 'x'])->assertStatus(404);
    }

    #[Test]
    public function test_vendor_scope_filters_by_binding_and_fails_closed_without_one(): void
    {
        $actor = $this->createUser();
        $this->assignRole($actor, 'orders_admin');
        $myVendor = $this->createVendor($actor);
        $otherVendor = $this->createVendor($this->createVendorUser());
        $customer = $this->createUser();

        $mine = $this->placeOrder($customer->id, $myVendor->id);
        $theirs = $this->placeOrder($customer->id, $otherVendor->id);

        $this->superAdmin();
        $this->grantScope([
            'holder_type' => 'role',
            'holder_id' => 'orders_admin',
            'permission' => 'orders.orders.view',
            'scope' => 'vendor',
        ]);

        $scoped = $this->actingAs($actor, 'sanctum')->getJson('/api/admin/orders')->assertOk();
        $this->assertSame(1, $scoped->json('meta.total'));
        $this->assertSame($mine, $scoped->json('data.0.id'));
        $this->getJson("/api/admin/orders/{$theirs}")->assertStatus(404);

        // Holder with NO vendor binding -> fail closed (empty list).
        $noVendor = $this->createUser();
        $this->assignRole($noVendor, 'orders_admin');
        $this->actingAs($noVendor, 'sanctum')
            ->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    #[Test]
    public function test_domain_scope_filters_tickets_by_department_and_guards_assign(): void
    {
        $deptA = (string) Str::uuid();
        $deptB = (string) Str::uuid();
        \Illuminate\Support\Facades\DB::table('departments')->insert([
            ['id' => $deptA, 'name' => 'Billing', 'created_at' => now(), 'updated_at' => now()],
            ['id' => $deptB, 'name' => 'Technical', 'created_at' => now(), 'updated_at' => now()],
        ]);
        $requester = $this->createUser();
        $ticketA = $this->makeTicket($requester->id, $deptA);
        $ticketB = $this->makeTicket($requester->id, $deptB);

        $agent = $this->createUser();
        $this->assignRole($agent, 'support_admin');

        $this->superAdmin();
        $this->grantScope([
            'holder_type' => 'role',
            'holder_id' => 'support_admin',
            'permission' => 'support.tickets.view',
            'scope' => 'domain',
            'scope_value' => $deptA,
        ]);

        $scoped = $this->actingAs($agent, 'sanctum')
            ->getJson('/api/admin/support/tickets')
            ->assertOk();
        $this->assertSame(1, $scoped->json('total'));
        $this->assertSame($ticketA, $scoped->json('data.0.id'));

        // Assigning outside the domain fails closed (404).
        $assignee = $this->createUser();
        $this->patchJson("/api/admin/support/tickets/{$ticketB}/assign", ['assigned_to' => $assignee->id])
            ->assertStatus(404);
        $this->patchJson("/api/admin/support/tickets/{$ticketA}/assign", ['assigned_to' => $assignee->id])
            ->assertOk();
    }

    #[Test]
    public function test_deferred_scopes_architect_but_do_not_narrow(): void
    {
        $actor = $this->createUser();
        $this->assignRole($actor, 'orders_admin');
        $customer = $this->createUser();
        $vendor = $this->createVendor($this->createVendorUser());
        $this->placeOrder($customer->id, $vendor->id);
        $this->placeOrder($customer->id, $vendor->id);

        $this->superAdmin();

        foreach (['team', 'country', 'region'] as $deferred) {
            $this->postJson('/api/admin/rbac/scopes', [
                'holder_type' => 'role',
                'holder_id' => 'orders_admin',
                'permission' => 'orders.orders.view',
                'scope' => $deferred,
            ])->assertStatus(201);

            // Architected but enforcement deferred: rows stay unfiltered.
            $this->actingAs($actor, 'sanctum')
                ->getJson('/api/admin/orders')
                ->assertOk()
                ->assertJsonPath('meta.total', 2);

            $this->actingAs($this->superAdmin(), 'sanctum');
        }
    }

    #[Test]
    public function test_super_admin_bypasses_scope_rows(): void
    {
        $customer = $this->createUser();
        $vendor = $this->createVendor($this->createVendorUser());
        $this->placeOrder($customer->id, $vendor->id);
        $this->placeOrder($customer->id, $vendor->id);

        $this->superAdmin();
        $this->grantScope([
            'holder_type' => 'role',
            'holder_id' => 'super_admin',
            'permission' => 'orders.orders.view',
            'scope' => 'own',
        ]);

        // super_admin's own customer_id matches neither order, but the
        // bypass keeps the full view (mirrors hasPermission semantics).
        $this->actingAs($this->createAdmin(), 'sanctum')
            ->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    #[Test]
    public function test_user_level_scope_row_beats_role_rows(): void
    {
        $actor = $this->createUser();
        $this->assignRole($actor, 'orders_admin');
        $stranger = $this->createUser();
        $vendor = $this->createVendor($this->createVendorUser());

        $ownOrder = $this->placeOrder($actor->id, $vendor->id);
        $this->placeOrder($stranger->id, $vendor->id);

        $this->superAdmin();
        $this->grantScope([
            'holder_type' => 'role',
            'holder_id' => 'orders_admin',
            'permission' => 'orders.orders.view',
            'scope' => 'vendor',
        ]);
        $this->grantScope([
            'holder_type' => 'user',
            'holder_id' => $actor->id,
            'permission' => 'orders.orders.view',
            'scope' => 'own',
        ]);

        // Own-order customer binding is unrelated to the vendor binding, so
        // the user row (own) wins over the role row (vendor).
        $scoped = $this->actingAs($actor, 'sanctum')->getJson('/api/admin/orders')->assertOk();
        $this->assertSame(1, $scoped->json('meta.total'));
        $this->assertSame($ownOrder, $scoped->json('data.0.id'));
    }

    #[Test]
    public function test_scope_grant_upserts_instead_of_duplicating(): void
    {
        $this->superAdmin();
        $payload = [
            'holder_type' => 'role',
            'holder_id' => 'orders_admin',
            'permission' => 'orders.orders.view',
        ];

        $this->grantScope([...$payload, 'scope' => 'own']);
        $this->grantScope([...$payload, 'scope' => 'vendor']);

        $listed = $this->getJson('/api/admin/rbac/scopes')->assertOk()->json('data');
        $this->assertCount(1, $listed);
        $this->assertSame('vendor', $listed[0]['scope']);
    }
}
