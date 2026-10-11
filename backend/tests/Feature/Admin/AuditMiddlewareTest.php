<?php

namespace Tests\Feature\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * W16 (R-06/N-01): the audit middleware covers every authenticated
 * mutating request - API and admin alike - with an `audit_logs` row.
 * Reads and guest requests write nothing.
 */
class AuditMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_mutation_writes_an_audit_row(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/newsletter/subscribe', ['email' => 'audit-me@example.com'])
            ->assertStatus(201);

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => 'api_request',
            'entity_id' => 'api/newsletter/subscribe',
            'performed_by' => $user->id,
            'action' => 'POST api/newsletter/subscribe',
        ]);
    }

    public function test_admin_mutation_is_audited_with_actor(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/newsletter/subscribe', ['email' => 'audit-admin@example.com'])
            ->assertStatus(201);

        $row = DB::table('audit_logs')
            ->where('entity_type', 'api_request')
            ->where('performed_by', $admin->id)
            ->orderByDesc('created_at')
            ->first();

        $this->assertNotNull($row);
        $this->assertStringStartsWith('POST ', $row->action);
    }

    public function test_authenticated_reads_write_no_audit_rows(): void
    {
        $before = DB::table('audit_logs')->count();

        $user = $this->createUser();
        $this->actingAs($user, 'sanctum')->getJson('/api/products')->assertOk();

        $this->assertEquals($before, DB::table('audit_logs')->count());
    }

    public function test_guest_mutation_writes_no_audit_row(): void
    {
        // No actingAs in this test: the request is genuinely unauthenticated.
        $this->postJson('/api/newsletter/subscribe', ['email' => 'guest-no-audit@example.com'])
            ->assertStatus(201);

        $this->assertEquals(0, DB::table('audit_logs')->count());
    }
}
