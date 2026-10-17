<?php

namespace App\Console\Commands;

use Core\Support\AuditChain;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Phase 4: verify the tamper-evident audit chain.
 *
 * Recomputes every link in sequence order. Legacy rows written before the
 * chain existed (hash IS NULL) are reported, not failed. Any recomputed
 * mismatch — edit, delete, or reorder — fails the command.
 */
class VerifyAuditChain extends Command
{
    protected $signature = 'audit:verify-chain';

    protected $description = 'Verify the audit_logs hash chain (tamper-evidence)';

    public function handle(): int
    {
        $verified = 0;
        $legacy = 0;
        $brokenAt = null;

        $prev = AuditChain::GENESIS;

        foreach (DB::table('audit_logs')->orderBy('sequence')->cursor() as $row) {
            if ($row->hash === null) {
                $legacy++;
                continue;
            }

            $expected = AuditChain::hash([
                'action' => $row->action,
                'entity_type' => $row->entity_type,
                'entity_id' => $row->entity_id,
                'performed_by' => $row->performed_by,
                'old_values' => $row->old_values,
                'new_values' => $row->new_values,
                'metadata' => $row->metadata ?? null,
                'ip_address' => $row->ip_address ?? null,
                'created_at' => $row->created_at,
            ], $prev);

            $expectedPrev = $prev === AuditChain::GENESIS ? null : $prev;

            if (!hash_equals((string) $expected, (string) $row->hash) || $row->prev_hash !== $expectedPrev) {
                $brokenAt = $row->sequence ?? $row->id;
                break;
            }

            $prev = $row->hash;
            $verified++;
        }

        $this->info("audit:verify-chain — verified={$verified} legacy={$legacy}".($brokenAt !== null ? " BROKEN AT sequence {$brokenAt}" : ' chain intact'));

        return $brokenAt !== null ? self::FAILURE : self::SUCCESS;
    }
}
