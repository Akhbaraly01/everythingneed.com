<?php

namespace Tests\Feature\Admin;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * W6 — audit console: index filters/validation, CSV export gated by BOTH
 * `can:viewAuditLogs` and `audit.logs.export` (a permission grant alone is
 * not enough — administrator holds audit.* but is refused), self-auditing
 * export, and streamed CSV content.
 */
class AdminAuditConsoleTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function insertAudit(string $action, string $entityType, string $entityId): void
    {
        DB::table('audit_logs')->insert([
            'id'           => (string) Str::uuid(),
            'action'       => $action,
            'entity_type'  => $entityType,
            'entity_id'    => $entityId,
            'performed_by' => '00000000-0000-0000-0000-000000000000',
            'created_at'   => now(),
        ]);
    }

    public function test_export_requires_view_policy_and_permission(): void
    {
        // Guest never reaches either gate.
        $this->getJson('/api/admin/audit-logs/export')->assertUnauthorized();

        // analyst: neither gate (no audit.* at all).
        $analyst = $this->createUser();
        $this->assignRole($analyst, 'analyst');
        $this->actingAs($analyst, 'sanctum');
        $this->getJson('/api/admin/audit-logs/export')->assertForbidden();

        // administrator: holds audit.logs.export (audit.*) but NOT viewAuditLogs —
        // the double gate must keep them out of the export.
        $admin = $this->createUser();
        $this->assignRole($admin, 'administrator');
        $this->actingAs($admin, 'sanctum');
        $this->getJson('/api/admin/audit-logs/export')->assertForbidden();

        // finance_admin: holds audit.logs.view (not export, not the policy).
        $finance = $this->createUser();
        $this->assignRole($finance, 'finance_admin');
        $this->actingAs($finance, 'sanctum');
        $this->getJson('/api/admin/audit-logs/export')->assertForbidden();

        // security_admin: viewAuditLogs + audit.* — allowed.
        $security = $this->createUser();
        $this->assignRole($security, 'security_admin');
        $this->actingAs($security, 'sanctum');
        $this->getJson('/api/admin/audit-logs/export')->assertOk();

        // auditor: viewAuditLogs + audit.* — allowed.
        $auditor = $this->createUser();
        $this->assignRole($auditor, 'auditor');
        $this->actingAs($auditor, 'sanctum');
        $this->getJson('/api/admin/audit-logs/export')->assertOk();

        // super_admin: allowed.
        $super = $this->createUser();
        $this->assignRole($super, 'super_admin');
        $this->actingAs($super, 'sanctum');
        $this->getJson('/api/admin/audit-logs/export')->assertOk();
    }

    public function test_export_streams_filtered_csv(): void
    {
        $this->insertAudit('create', 'audit_fixture', 'row-keep-create');
        $this->insertAudit('delete', 'audit_fixture', 'row-exclude-delete');

        $auditor = $this->createUser();
        $this->assignRole($auditor, 'auditor');
        $this->actingAs($auditor, 'sanctum');

        $res = $this->get('/api/admin/audit-logs/export?action=create&entity_type=audit_fixture');
        $res->assertOk();
        $this->assertStringContainsString('text/csv', (string) $res->headers->get('Content-Type'));
        $this->assertStringContainsString(
            'everythingneed-audit-logs-',
            (string) $res->headers->get('Content-Disposition'),
        );

        $csv = $res->streamedContent();
        $this->assertStringContainsString(
            'created_at,action,entity_type,entity_id,actor_name,actor_email,old_values,new_values',
            $csv,
        );
        $this->assertStringContainsString('row-keep-create', $csv);
        $this->assertStringNotContainsString('row-exclude-delete', $csv);
    }

    public function test_export_writes_a_self_audit_event(): void
    {
        $before = (int) DB::table('audit_logs')
            ->where('action', 'export')
            ->where('entity_type', 'audit_logs')
            ->count();

        $auditor = $this->createUser();
        $this->assignRole($auditor, 'auditor');
        $this->actingAs($auditor, 'sanctum');
        $this->get('/api/admin/audit-logs/export')->assertOk();

        $this->assertSame($before + 1, (int) DB::table('audit_logs')
            ->where('action', 'export')
            ->where('entity_type', 'audit_logs')
            ->where('performed_by', $auditor->id)
            ->count());
    }

    public function test_index_filters_and_validation(): void
    {
        $this->insertAudit('create', 'audit_fixture', 'idx-row-1');

        $auditor = $this->createUser();
        $this->assignRole($auditor, 'auditor');
        $this->actingAs($auditor, 'sanctum');

        // Filtered read returns paginator meta.
        $res = $this->getJson('/api/admin/audit-logs?action=create&entity_type=audit_fixture')
            ->assertOk();
        $this->assertIsArray($res->json('data'));
        $this->assertArrayHasKey('total', $res->json('meta'));
        $this->assertContains('idx-row-1', array_column($res->json('data'), 'entity_id'));

        // Unknown action is a validation error, not a silent empty list.
        $this->getJson('/api/admin/audit-logs?action=explode')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['action']);

        // Inverted date range rejected.
        $this->getJson('/api/admin/audit-logs?date_from=2026-10-01&date_to=2026-09-01')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['date_to']);

        // Export shares the same filter contract (no paging params needed).
        $this->get('/api/admin/audit-logs/export?action=create&per_page=9999')->assertOk();
        $this->get('/api/admin/audit-logs/export?action=explode')->assertStatus(422);
    }

    public function test_index_is_gated_like_the_page(): void
    {
        $this->getJson('/api/admin/audit-logs')->assertUnauthorized();

        $denied = $this->createUser();
        $this->assignRole($denied, 'content_manager');
        $this->actingAs($denied, 'sanctum');
        $this->getJson('/api/admin/audit-logs')->assertForbidden();

        $auditor = $this->createUser();
        $this->assignRole($auditor, 'auditor');
        $this->actingAs($auditor, 'sanctum');
        $this->getJson('/api/admin/audit-logs')->assertOk();
    }
}
