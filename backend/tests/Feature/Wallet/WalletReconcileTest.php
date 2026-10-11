<?php

namespace Tests\Feature\Wallet;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletHold;
use App\Models\WalletTransaction;
use Core\Services\WalletService;
use Tests\TestCase;

class WalletReconcileTest extends TestCase
{
    private WalletService $wallet;

    protected function setUp(): void
    {
        parent::setUp();
        $this->wallet = $this->app->make(WalletService::class);
    }

    public function test_reconcile_reports_clean_ledgers(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 100.00, 'REF-1');
        $this->wallet->debit($user->id, 30.00, 'REF-2');

        $this->artisan('financial:reconcile')
            ->expectsOutputToContain('Ledger mismatches: 0')
            ->assertExitCode(0);
    }

    public function test_reconcile_detects_ledger_mismatch(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 100.00, 'REF-1');

        $wallet = Wallet::where('user_id', $user->id)->firstOrFail();
        Wallet::where('id', $wallet->id)->update(['balance' => 999.00]);

        $this->artisan('financial:reconcile')
            ->expectsOutputToContain('Ledger mismatches: 1')
            ->assertExitCode(0);
    }

    public function test_reconcile_fix_balances_repairs_wallet(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 100.00, 'REF-1');

        $wallet = Wallet::where('user_id', $user->id)->firstOrFail();
        Wallet::where('id', $wallet->id)->update(['balance' => 500.00]);

        $this->artisan('financial:reconcile --fix-balances')
            ->assertExitCode(0);

        $this->assertEquals(100.00, $this->wallet->getBalance($user->id));
    }

    public function test_release_expired_holds(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');
        $this->wallet->hold($user->id, 40.00, 'HOLD-EXP');

        WalletHold::where('reference', 'HOLD-EXP')
            ->update(['expires_at' => now()->subHour()]);

        $this->assertEquals(60.00, $this->wallet->getAvailableBalance($user->id));

        $this->artisan('financial:reconcile --release-expired')
            ->expectsOutputToContain('Expired holds released: 1')
            ->assertExitCode(0);

        $this->assertEquals(100.00, $this->wallet->getAvailableBalance($user->id));
        $this->assertEquals('released', WalletHold::where('reference', 'HOLD-EXP')->firstOrFail()->status);
    }
}
