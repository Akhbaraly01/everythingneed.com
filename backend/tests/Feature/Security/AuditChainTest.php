<?php

namespace Tests\Feature\Security;

use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Phase 4: the audit trail is hash-chained — edits, deletes, or reorders
 * break verification. Legacy pre-chain rows report without failing.
 */
class AuditChainTest extends TestCase
{
    use RefreshDatabase;

    private function log(string $action, string $entity = 'e1'): void
    {
        app(AuditServiceInterface::class)->log([
            'action' => $action,
            'entity_type' => 'probe',
            'entity_id' => $entity,
            'performed_by' => $this->createUser()->id,
        ]);
    }

    public function test_chained_rows_verify_end_to_end(): void
    {
        $this->log('probe.one');
        $this->log('probe.two', 'e2');
        $this->log('probe.three', 'e3');

        $rows = DB::table('audit_logs')->orderBy('sequence')->get();
        $this->assertCount(3, $rows);
        $this->assertNotNull($rows[0]->hash);
        $this->assertNull($rows[0]->prev_hash);
        $this->assertSame($rows[0]->hash, $rows[1]->prev_hash);
        $this->assertSame($rows[1]->hash, $rows[2]->prev_hash);

        $this->artisan('audit:verify-chain')
            ->expectsOutputToContain('chain intact')
            ->assertSuccessful();
    }

    public function test_edited_row_breaks_verification(): void
    {
        $this->log('probe.one');
        $this->log('probe.two', 'e2');

        DB::table('audit_logs')->where('action', 'probe.one')->update(['action' => 'probe.forged']);

        $this->artisan('audit:verify-chain')->assertFailed();
    }

    public function test_deleted_row_breaks_verification(): void
    {
        $this->log('probe.one');
        $this->log('probe.two', 'e2');
        $this->log('probe.three', 'e3');

        DB::table('audit_logs')->where('action', 'probe.two')->delete();

        $this->artisan('audit:verify-chain')->assertFailed();
    }

    public function test_legacy_unchained_rows_report_without_failing(): void
    {
        DB::table('audit_logs')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'action' => 'legacy.row',
            'entity_type' => 'probe',
            'entity_id' => 'old',
            'performed_by' => '00000000-0000-0000-0000-000000000000',
            'created_at' => now(),
        ]);

        $this->log('probe.new');

        $this->artisan('audit:verify-chain')
            ->expectsOutputToContain('legacy=1')
            ->assertSuccessful();
    }
}
