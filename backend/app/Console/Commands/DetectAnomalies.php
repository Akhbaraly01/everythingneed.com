<?php

namespace App\Console\Commands;

use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Phase 5: audit-trail anomaly detection (alerts, never blocks).
 *
 * Scans the last hour of audit rows for abuse shapes and records one
 * `anomaly.*` row per shape+key (deduplicated per window):
 *  - auth.login_failed bursts per IP (>= 10)
 *  - permission grant bursts per actor (>= 10 role/user/scope writes)
 *  - refund spikes per actor (>= 5)
 *
 * Thresholds are intentionally conservative; tune the constants for the
 * traffic profile. Runs daily via routes/console.php.
 */
class DetectAnomalies extends Command
{
    protected $signature = 'security:detect-anomalies';

    protected $description = 'Detect abuse shapes in audit_logs and record anomaly rows';

    private const LOGIN_BURST = 10;

    private const GRANT_BURST = 10;

    private const REFUND_SPIKE = 5;

    public function handle(AuditServiceInterface $audit): int
    {
        $since = now()->subHour();
        $raised = 0;

        $raised += $this->burst(
            $audit,
            'anomaly.login_burst',
            DB::table('audit_logs')
                ->selectRaw('ip_address as bucket, count(*) as total')
                ->where('action', 'auth.login_failed')
                ->where('created_at', '>=', $since)
                ->whereNotNull('ip_address')
                ->groupBy('ip_address')
                ->havingRaw('count(*) >= ?', [self::LOGIN_BURST])
                ->get(),
            fn ($row) => ['ip' => $row->bucket, 'failures' => (int) $row->total],
            $since
        );

        $raised += $this->burst(
            $audit,
            'anomaly.grant_burst',
            DB::table('audit_logs')
                ->selectRaw('performed_by as bucket, count(*) as total')
                ->whereIn('entity_type', ['role_permission', 'user_permission', 'permission_scope'])
                ->where('created_at', '>=', $since)
                ->groupBy('performed_by')
                ->havingRaw('count(*) >= ?', [self::GRANT_BURST])
                ->get(),
            fn ($row) => ['actor' => $row->bucket, 'grants' => (int) $row->total],
            $since
        );

        $raised += $this->burst(
            $audit,
            'anomaly.refund_spike',
            DB::table('audit_logs')
                ->selectRaw('performed_by as bucket, count(*) as total')
                ->whereIn('action', ['wallet.refund', 'payment.refunded'])
                ->where('created_at', '>=', $since)
                ->groupBy('performed_by')
                ->havingRaw('count(*) >= ?', [self::REFUND_SPIKE])
                ->get(),
            fn ($row) => ['actor' => $row->bucket, 'refunds' => (int) $row->total],
            $since
        );

        $this->info("security:detect-anomalies complete — raised={$raised}");

        return self::SUCCESS;
    }

    /**
     * @param \Illuminate\Support\Collection<int, object{bucket: string, total: int}> $buckets
     */
    private function burst(
        AuditServiceInterface $audit,
        string $action,
        $buckets,
        callable $details,
        $since
    ): int {
        $raised = 0;

        foreach ($buckets as $bucket) {
            $already = DB::table('audit_logs')
                ->where('action', $action)
                ->where('created_at', '>=', $since)
                ->where('entity_id', $bucket->bucket)
                ->exists();

            if ($already) {
                continue;
            }

            try {
                $audit->log([
                    'action' => $action,
                    'entity_type' => 'security_anomaly',
                    'entity_id' => $bucket->bucket,
                    'performed_by' => null,
                    'new_values' => $details($bucket),
                ]);
                $raised++;
            } catch (\Throwable) {
            }
        }

        return $raised;
    }
}
