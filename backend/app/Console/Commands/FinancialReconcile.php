<?php

namespace App\Console\Commands;

use App\Models\Wallet;
use App\Models\WalletHold;
use App\Models\WalletTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Payments\Entities\Payment;

class FinancialReconcile extends Command
{
    protected $signature = 'financial:reconcile
        {--release-expired : Auto-release expired active holds}
        {--fix-balances : Recompute wallet balances from transaction ledgers}';

    protected $description = 'Reconcile wallet balances, holds, and payment statuses';

    public function handle(): int
    {
        $this->info('=== Financial reconciliation ===');

        $this->reportStuckPayments();
        $this->reportLedgerMismatches();
        $this->reportPaymentRefundDrift();
        $this->reportWebhookEvents();
        $this->reportIncompleteTransfers();
        $this->reportNegativeAvailability();

        if ($this->option('release-expired')) {
            $this->releaseExpiredHolds();
        }

        if ($this->option('fix-balances')) {
            $this->fixWalletBalances();
        }

        $this->info('Reconciliation complete.');
        return self::SUCCESS;
    }

    private function reportStuckPayments(): void
    {
        $threshold = now()->subMinutes(30);

        $stuck = Payment::whereIn('status', ['pending', 'processing'])
            ->where('created_at', '<', $threshold)
            ->count();

        $this->info("Stuck payments (pending/processing > 30m): {$stuck}");
    }

    private function reportLedgerMismatches(): void
    {
        $mismatches = 0;

        Wallet::query()->chunkById(100, function ($wallets) use (&$mismatches) {
            foreach ($wallets as $wallet) {
                $tx = WalletTransaction::where('wallet_id', $wallet->id)
                    ->orderBy('created_at')
                    ->orderBy('id')
                    ->get();

                $running = 0.0;
                foreach ($tx as $t) {
                    $amount = (float) $t->amount;
                    $running = $t->type === 'credit'
                        ? round($running + $amount, 2)
                        : round($running - $amount, 2);
                }

                $stored = round((float) $wallet->balance, 2);
                if (abs($running - $stored) > 0.01) {
                    $mismatches++;
                    $this->warn(sprintf(
                        '  Wallet %s: ledger=%.2f stored=%.2f (user=%s)',
                        $wallet->id,
                        $running,
                        $stored,
                        $wallet->user_id
                    ));
                }
            }
        });

        $this->info("Ledger mismatches: {$mismatches}");
    }

    /**
     * Spec 31 reconciliation: refunded amounts must agree with the payment
     * status - a fully refunded charge has its money back, a partial one
     * does not.
     */
    private function reportPaymentRefundDrift(): void
    {
        $drift = 0;

        Payment::whereIn('status', ['refunded', 'partially_refunded', 'succeeded'])
            ->with('refunds')
            ->chunkById(100, function ($payments) use (&$drift) {
                foreach ($payments as $payment) {
                    $refunded = 0.0;
                    foreach ($payment->refunds as $refund) {
                        // Pending (manual gateway) or completed money movement.
                        if ($refund->status !== 'failed') {
                            $refunded += (float) $refund->amount;
                        }
                    }

                    $amount = (float) $payment->amount;
                    $bad = match ($payment->status) {
                        'refunded' => $refunded < $amount - 0.01,
                        'partially_refunded' => $refunded <= 0.01 || $refunded >= $amount - 0.01,
                        default => $refunded > 0.01,
                    };

                    if ($bad) {
                        $drift++;
                        $this->warn(sprintf(
                            '  Payment %s (%s): amount=%.2f refunded=%.2f',
                            $payment->reference,
                            $payment->status,
                            $amount,
                            $refunded
                        ));
                    }
                }
            });

        $this->info("Payment/refund drifts: {$drift}");
    }

    /**
     * Failed or ignored webhook events deserve a human look (spec 74).
     */    private function reportWebhookEvents(): void
    {
        $failed = DB::table('payment_webhook_events')->where('status', 'failed')->count();
        $ignored = DB::table('payment_webhook_events')->where('status', 'ignored')->count();

        $this->info("Webhook events failed: {$failed}, ignored: {$ignored}");
    }

    /**
     * Spec 29 reconciliation: every transfer debit must have its credit leg —
     * a half-written transfer means money vanished from one wallet without
     * arriving in the other. Single-leg namespaces (withdrawals, wallet
     * payments, hold captures) are excluded by construction.
     */
    private function reportIncompleteTransfers(): void
    {
        $holdRefs = DB::table('wallet_holds')->distinct()->pluck('reference')->all();

        $debitRefs = DB::table('wallet_transactions')
            ->where('type', 'debit')
            ->where('reference', 'not like', 'WALLET-WDR-%')
            ->where('reference', 'not like', 'WALLET-PAY-%')
            ->distinct()
            ->pluck('reference');

        $incomplete = 0;
        foreach ($debitRefs as $reference) {
            if (in_array($reference, $holdRefs, true)) {
                continue;
            }
            $legs = DB::table('wallet_transactions')->where('reference', $reference)->count();
            if ($legs < 2) {
                $incomplete++;
                $this->warn("  Transfer {$reference}: debit without its credit leg");
            }
        }

        $this->info("Incomplete transfers: {$incomplete}");
    }

    /**
     * No wallet may promise more than it holds: available must never go
     * negative, even after manual adjustments.
     */
    private function reportNegativeAvailability(): void
    {
        $negative = 0;

        Wallet::query()->chunkById(100, function ($wallets) use (&$negative) {
            foreach ($wallets as $wallet) {
                $held = (float) DB::table('wallet_holds')
                    ->where('wallet_id', $wallet->id)
                    ->where('status', 'active')
                    ->sum('amount');

                if ((float) $wallet->balance - $held < -0.01) {
                    $negative++;
                    $this->warn(sprintf(
                        '  Wallet %s: balance=%.2f active_holds=%.2f (user=%s)',
                        $wallet->id,
                        (float) $wallet->balance,
                        $held,
                        $wallet->user_id
                    ));
                }
            }
        });

        $this->info("Negative availability: {$negative}");
    }

    private function releaseExpiredHolds(): void
    {
        $released = WalletHold::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->update([
                'status' => 'released',
                'released_at' => now(),
            ]);

        $this->info("Expired holds released: {$released}");
    }

    private function fixWalletBalances(): void
    {
        $fixed = 0;

        Wallet::query()->chunkById(100, function ($wallets) use (&$fixed) {
            foreach ($wallets as $wallet) {
                $tx = WalletTransaction::where('wallet_id', $wallet->id)
                    ->orderBy('created_at')
                    ->orderBy('id')
                    ->get();

                $running = 0.0;
                foreach ($tx as $t) {
                    $amount = (float) $t->amount;
                    $running = $t->type === 'credit'
                        ? round($running + $amount, 2)
                        : round($running - $amount, 2);
                }

                $stored = round((float) $wallet->balance, 2);
                if (abs($running - $stored) > 0.01) {
                    DB::table('wallets')
                        ->where('id', $wallet->id)
                        ->update(['balance' => $running]);
                    $fixed++;
                    $this->warn(sprintf('  Fixed wallet %s: %.2f → %.2f', $wallet->id, $stored, $running));
                }
            }
        });

        $this->info("Wallet balances fixed: {$fixed}");
    }
}
