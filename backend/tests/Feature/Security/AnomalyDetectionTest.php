<?php

namespace Tests\Feature\Security;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Phase 5: security:detect-anomalies raises one audit row per abuse
 * shape+key per hour (login bursts, grant bursts, refund spikes) and
 * stays quiet below threshold.
 */
class AnomalyDetectionTest extends TestCase
{
    use RefreshDatabase;

    private function seedAudit(string $action, string $entity, int $n, array $extra = []): void
    {
        for ($i = 0; $i < $n; $i++) {
            DB::table('audit_logs')->insert(array_merge([
                'id' => (string) Str::uuid(),
                'action' => $action,
                'entity_type' => 'probe',
                'entity_id' => "probe-{$i}",
                'performed_by' => '00000000-0000-0000-0000-000000000000',
                'created_at' => now(),
            ], $extra));
        }
    }

    public function test_login_burst_raises_once_per_ip_per_hour(): void
    {
        $this->seedAudit('auth.login_failed', 'probe', 10, ['ip_address' => '10.9.9.9']);
        $this->seedAudit('auth.login_failed', 'probe', 3, ['ip_address' => '10.9.9.10']);

        $this->artisan('security:detect-anomalies')->assertSuccessful();

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'anomaly.login_burst',
            'entity_id' => '10.9.9.9',
        ]);
        $this->assertDatabaseMissing('audit_logs', [
            'action' => 'anomaly.login_burst',
            'entity_id' => '10.9.9.10',
        ]);

        // Second run inside the window raises nothing new.
        $this->artisan('security:detect-anomalies')->assertSuccessful();
        $this->assertSame(1, DB::table('audit_logs')->where('action', 'anomaly.login_burst')->count());
    }

    public function test_grant_burst_and_refund_spike_raise(): void
    {
        $actor = (string) Str::uuid();

        for ($i = 0; $i < 10; $i++) {
            DB::table('audit_logs')->insert([
                'id' => (string) Str::uuid(),
                'action' => 'update',
                'entity_type' => 'role_permission',
                'entity_id' => "role:perm-{$i}",
                'performed_by' => $actor,
                'created_at' => now(),
            ]);
        }

        for ($i = 0; $i < 5; $i++) {
            DB::table('audit_logs')->insert([
                'id' => (string) Str::uuid(),
                'action' => 'payment.refunded',
                'entity_type' => 'payment',
                'entity_id' => "pay-{$i}",
                'performed_by' => $actor,
                'created_at' => now(),
            ]);
        }

        $this->artisan('security:detect-anomalies')->assertSuccessful();

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'anomaly.grant_burst',
            'entity_id' => $actor,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'anomaly.refund_spike',
            'entity_id' => $actor,
        ]);
    }
}
