<?php

namespace Core\Services;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Core\Services\Contracts\WalletServiceInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class WalletService extends BaseService implements WalletServiceInterface
{
    public function topUp(string $userId, float $amount, string $reference, ?string $description = null): object
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Amount must be positive.');
        }

        return DB::transaction(function () use ($userId, $amount, $reference, $description) {
            $wallet = $this->lockOrCreateWallet($userId);

            // Idempotent: same wallet+reference never double-credits.
            $existing = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('reference', $reference)
                ->first();
            if ($existing) {
                return $existing;
            }

            $newBalance = round((float) $wallet->balance + $amount, 2);
            $wallet->update(['balance' => $newBalance]);

            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_after' => $newBalance,
                'reference' => $reference,
                'description' => $description ?? "Wallet top-up of {$amount}",
                'created_at' => now(),
            ]);

            return $transaction;
        });
    }

    public function debit(string $userId, float $amount, string $reference, ?string $description = null): object
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Amount must be positive.');
        }

        return DB::transaction(function () use ($userId, $amount, $reference, $description) {
            $wallet = $this->lockOrCreateWallet($userId);

            $existing = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('reference', $reference)
                ->first();
            if ($existing) {
                return $existing;
            }

            // Spec 29: outflows respect holds — only the available balance
            // (balance minus active holds) is spendable.
            if ((float) $this->availableFor($wallet) < $amount) {
                throw new \InvalidArgumentException('Insufficient wallet balance.');
            }

            $newBalance = round((float) $wallet->balance - $amount, 2);
            $wallet->update(['balance' => $newBalance]);

            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $newBalance,
                'reference' => $reference,
                'description' => $description ?? "Wallet debit of {$amount}",
                'created_at' => now(),
            ]);

            return $transaction;
        });
    }

    public function transfer(string $fromUserId, string $toUserId, float $amount, string $reference): array
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Amount must be positive.');
        }

        if ($fromUserId === $toUserId) {
            throw new \InvalidArgumentException('Cannot transfer to the same wallet.');
        }

        return DB::transaction(function () use ($fromUserId, $toUserId, $amount, $reference) {
            // Lock in deterministic order (by user_id) to avoid deadlocks.
            $ids = [$fromUserId, $toUserId];
            sort($ids);

            $wallets = [];
            foreach ($ids as $uid) {
                $wallets[$uid] = $this->lockOrCreateWallet($uid);
            }
            $fromWallet = $wallets[$fromUserId];
            $toWallet = $wallets[$toUserId];

            $existingDebit = WalletTransaction::where('wallet_id', $fromWallet->id)
                ->where('reference', $reference)
                ->where('type', 'debit')
                ->first();
            if ($existingDebit) {
                $existingCredit = WalletTransaction::where('wallet_id', $toWallet->id)
                    ->where('reference', $reference)
                    ->where('type', 'credit')
                    ->first();
                if ($existingCredit) {
                    return ['debit' => $existingDebit, 'credit' => $existingCredit, 'idempotent' => true];
                }
            }

            if ((float) $this->availableFor($fromWallet) < $amount) {
                throw new \InvalidArgumentException('Insufficient wallet balance.');
            }

            $fromNewBalance = round((float) $fromWallet->balance - $amount, 2);
            $toNewBalance = round((float) $toWallet->balance + $amount, 2);

            $fromWallet->update(['balance' => $fromNewBalance]);
            $toWallet->update(['balance' => $toNewBalance]);

            $debitTx = WalletTransaction::create([
                'wallet_id' => $fromWallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $fromNewBalance,
                'reference' => $reference,
                'description' => "Transfer to {$toUserId}",
                'created_at' => now(),
            ]);

            $creditTx = WalletTransaction::create([
                'wallet_id' => $toWallet->id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_after' => $toNewBalance,
                'reference' => $reference,
                'description' => "Transfer from {$fromUserId}",
                'created_at' => now(),
            ]);

            return [
                'debit' => $debitTx,
                'credit' => $creditTx,
            ];
        });
    }

    /**
     * Spendable funds inside an already-locked wallet row: balance minus
     * active holds. Every outflow (debit, transfer) gates on this so a
     * placed hold can never be over-committed.
     */
    private function availableFor(object $wallet): float
    {
        $held = (float) \App\Models\WalletHold::where('wallet_id', $wallet->id)
            ->where('status', 'active')
            ->sum('amount');

        return round((float) $wallet->balance - $held, 2);
    }

    public function getBalance(string $userId): float
    {
        $wallet = Wallet::where('user_id', $userId)->first()
            ?? $this->getOrCreateWallet($userId);

        return (float) $wallet->balance;
    }

    public function getAvailableBalance(string $userId): float
    {
        return DB::transaction(function () use ($userId) {
            $wallet = $this->lockOrCreateWallet($userId);
            $held = (float) \App\Models\WalletHold::where('wallet_id', $wallet->id)
                ->where('status', 'active')
                ->sum('amount');

            return round((float) $wallet->balance - $held, 2);
        });
    }

    public function hold(
        string $userId,
        float $amount,
        string $reference,
        ?string $reason = null,
        ?string $orderId = null,
        ?\DateTimeInterface $expiresAt = null
    ): object {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Amount must be positive.');
        }

        return DB::transaction(function () use ($userId, $amount, $reference, $reason, $orderId, $expiresAt) {
            $wallet = $this->lockOrCreateWallet($userId);

            $existing = \App\Models\WalletHold::where('wallet_id', $wallet->id)
                ->where('reference', $reference)
                ->first();
            if ($existing) {
                return $existing;
            }

            $held = (float) \App\Models\WalletHold::where('wallet_id', $wallet->id)
                ->where('status', 'active')
                ->sum('amount');
            $available = (float) $wallet->balance - $held;

            if ($available < $amount) {
                throw new \InvalidArgumentException('Insufficient available balance.');
            }

            return \App\Models\WalletHold::create([
                'wallet_id' => $wallet->id,
                'amount' => $amount,
                'status' => 'active',
                'reference' => $reference,
                'reason' => $reason,
                'order_id' => $orderId,
                'expires_at' => $expiresAt,
            ]);
        });
    }

    public function releaseHold(string $userId, string $reference): object
    {
        return DB::transaction(function () use ($userId, $reference) {
            $wallet = $this->lockOrCreateWallet($userId);

            $hold = \App\Models\WalletHold::where('wallet_id', $wallet->id)
                ->where('reference', $reference)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (!$hold) {
                throw new \InvalidArgumentException('Active hold not found.');
            }

            $hold->update([
                'status' => 'released',
                'released_at' => now(),
            ]);

            return $hold;
        });
    }

    public function captureHold(string $userId, string $reference): array
    {
        return DB::transaction(function () use ($userId, $reference) {
            $wallet = $this->lockOrCreateWallet($userId);

            $hold = \App\Models\WalletHold::where('wallet_id', $wallet->id)
                ->where('reference', $reference)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (!$hold) {
                throw new \InvalidArgumentException('Active hold not found.');
            }

            $amount = (float) $hold->amount;
            if ((float) $wallet->balance < $amount) {
                throw new \InvalidArgumentException('Insufficient wallet balance.');
            }

            $newBalance = round((float) $wallet->balance - $amount, 2);
            $wallet->update(['balance' => $newBalance]);

            $tx = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $newBalance,
                'reference' => $reference,
                'description' => "Hold capture of {$amount}",
                'created_at' => now(),
            ]);

            $hold->update([
                'status' => 'captured',
                'released_at' => now(),
            ]);

            return ['hold' => $hold, 'transaction' => $tx];
        });
    }

    public function listHolds(string $userId, int $page = 1, int $perPage = 15): object
    {
        $wallet = $this->getOrCreateWallet($userId);

        return \App\Models\WalletHold::where('wallet_id', $wallet->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    private function getOrCreateWallet(string $userId): Wallet
    {
        try {
            return Wallet::firstOrCreate(
                ['user_id' => $userId],
                ['balance' => 0, 'currency' => config('app.currency', 'USD')]
            );
        } catch (QueryException $e) {
            // Concurrent firstOrCreate race — unique(user_id) means one wins.
            $existing = Wallet::where('user_id', $userId)->first();
            if ($existing) {
                return $existing;
            }
            throw $e;
        }
    }

    private function lockOrCreateWallet(string $userId): Wallet
    {
        $wallet = $this->getOrCreateWallet($userId);

        return Wallet::where('id', $wallet->id)->lockForUpdate()->first() ?? $wallet;
    }
}
