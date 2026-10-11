<?php

namespace Tests\Feature\WaveP;

use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Wave P — spec 66: audit console extensions — the actions endpoint merges
 * the base vocabulary with whatever the table actually contains (dynamic
 * whitelist), dotted-action filters work against emitted rows, IP is
 * captured on auth events, and the trail stays role-gated.
 */
class AuditActionsEndpointTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    public function test_actions_endpoint_merges_base_vocabulary_with_emitted_actions(): void
    {
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        // An action that exists only because the table contains it.
        app(AuditServiceInterface::class)->log([
            'action' => 'wavep.emitted_probe',
            'entity_type' => 'wavep_probe',
            'entity_id' => 'probe-1',
            'performed_by' => $admin->id,
            'new_values' => ['probe' => true],
        ]);

        $res = $this->getJson('/api/admin/audit-logs/actions')->assertOk();
        $actions = $res->json('data');

        // Base vocabulary is always offered.
        $this->assertContains('create', $actions);
        $this->assertContains('auth.login', $actions);
        $this->assertContains('export', $actions);

        // Emitted-but-not-base actions come from the table.
        $this->assertContains('wavep.emitted_probe', $actions);
    }

    public function test_emitted_dotted_action_filters_and_unknown_action_is_422(): void
    {
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        app(AuditServiceInterface::class)->log([
            'action' => 'wavep.filter_probe',
            'entity_type' => 'wavep_probe',
            'entity_id' => 'probe-2',
            'performed_by' => $admin->id,
            'new_values' => [],
        ]);

        $ok = $this->getJson('/api/admin/audit-logs?action=wavep.filter_probe')->assertOk();
        $rows = $ok->json('data');
        $this->assertNotEmpty($rows);
        $this->assertSame('wavep.filter_probe', $rows[0]->action ?? $rows[0]['action']);

        // Unknown actions stay a validation error (never silently ignored).
        $this->getJson('/api/admin/audit-logs?action=definitely_not_an_action')
            ->assertStatus(422);
        $this->getJson('/api/admin/audit-logs/export?action=definitely_not_an_action')
            ->assertStatus(422);
    }

    public function test_login_emits_dotted_action_with_client_ip(): void
    {
        $user = $this->createUser(['password' => 'Password123!']);
        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Password123!',
        ])->assertOk();

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        $res = $this->getJson('/api/admin/audit-logs?action=auth.login')->assertOk();
        $row = collect($res->json('data'))->first(
            fn ($r) => ($r->action ?? $r['action']) === 'auth.login'
                && (($r->performed_by_email ?? $r['performed_by_email']) === $user->email)
        );

        $this->assertNotNull($row, 'auth.login row missing after login.');
        $ip = $row->ip_address ?? $row['ip_address'];
        $this->assertNotNull($ip, 'Login audit row must record the client IP.');
    }

    public function test_guest_cannot_read_the_audit_trail(): void
    {
        $this->getJson('/api/admin/audit-logs')->assertStatus(401);
        $this->getJson('/api/admin/audit-logs/actions')->assertStatus(401);
    }

    public function test_plain_user_cannot_read_the_audit_trail(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/admin/audit-logs')->assertStatus(403);
        $this->getJson('/api/admin/audit-logs/actions')->assertStatus(403);
    }
}
