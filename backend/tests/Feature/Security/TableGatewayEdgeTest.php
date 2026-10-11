<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * W3: TableGateway edge contract. The /api/db/* plane is intentionally
 * permission-less for plain users (whitelist + column allowlists +
 * ownership scope are the boundary); these tests pin the deny-by-default
 * edges: unknown tables, read-only mutations, filter/order/select abuse
 * and the documented admin bypass.
 */
class TableGatewayEdgeTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create();
    }

    public function test_unknown_table_is_not_found(): void
    {
        $this->actingAs($this->user())->getJson('/api/db/no_such_table')->assertNotFound();
    }

    public function test_read_only_tables_reject_all_mutations(): void
    {
        $user = $this->user();
        $id = '11111111-1111-1111-1111-111111111111';

        // orders is read-only through the gateway (module REST owns writes).
        $this->actingAs($user)->postJson('/api/db/orders', ['status' => 'paid'])->assertStatus(405);
        $this->actingAs($user)->putJson("/api/db/orders/{$id}", ['status' => 'paid'])->assertStatus(405);
        $this->actingAs($user)->deleteJson("/api/db/orders/{$id}")->assertStatus(405);
    }

    public function test_malformed_ids_never_reach_the_database(): void
    {
        $user = $this->user();

        // ValidateUuidParams rejects non-UUID identifiers at the gate.
        $this->actingAs($user)->putJson('/api/db/addresses/whatever', ['line1' => 'x'])->assertNotFound();
        $this->actingAs($user)->deleteJson('/api/db/addresses/whatever')->assertNotFound();
    }

    public function test_unsupported_filter_operator_is_rejected(): void
    {
        $user = $this->user();

        $this->actingAs($user)->getJson('/api/db/addresses?filters='.urlencode(json_encode([
            ['column' => 'city', 'op' => 'rlike', 'value' => 'x'],
        ])))->assertStatus(422);
    }

    public function test_select_and_order_abuse_is_neutralized(): void
    {
        $user = $this->user();

        // Unknown select columns are dropped, unknown orderBy ignored.
        $res = $this->actingAs($user)->getJson(
            '/api/db/addresses?select=line1,nope Union Select&orderBy=password&order=desc'
        )->assertOk();

        $this->assertSame(0, $res->json('meta.total'));

        // Limit is capped at 100.
        $res = $this->actingAs($user)->getJson('/api/db/addresses?limit=5000')->assertOk();
        $this->assertSame(100, $res->json('meta.limit'));
    }

    public function test_admin_bypass_sees_rows_beyond_own_scope(): void
    {
        $owner = $this->user();
        $admin = $this->user();
        \App\Models\UserRole::create(['user_id' => $admin->id, 'role' => 'administrator']);

        $id = $this->actingAs($owner)->postJson('/api/db/addresses', [
            'line1' => '10 Main St',
            'city' => 'Lagos',
            'country' => 'NG',
        ])->assertStatus(201)->json('data.id');

        // Plain stranger sees nothing (scoped to empty).
        $stranger = $this->user();
        $this->actingAs($stranger)->getJson('/api/db/addresses')->assertOk()
            ->assertJsonPath('meta.total', 0);

        // Administrator bypass (documented moderation path) sees the row.
        $this->actingAs($admin)->getJson('/api/db/addresses')->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->assertNotNull($id);
    }
}
