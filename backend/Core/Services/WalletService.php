<?php

namespace Core\Services;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Core\Services\Contracts\WalletServiceInterface;
use Illuminate\Support\Facades\DB;

class WalletService extends BaseService implements WalletServiceInterface
{
    public function topUp(string $userId, float $amount, string $reference): object
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Amount must be positive.');
        }

        return DB::transaction(function () use ($userId, $amount, $reference) {
            $wallet = $this->getOrCreateWallet($userId);
            $newBalance = round($wallet->balance + $amount, 2);

            $wallet->update(['balance' => $newBalance]);

            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_after' => $newBalance,
                'reference' => $reference,
                'description' => "Wallet top-up of {$amount}",
                'created_at' => now(),
            ]);

            return $transaction;
        });
    }

    public function debit(string $userId, float $amount, string $reference): object
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Amount must be positive.');
        }

        return DB::transaction(function () use ($userId, $amount, $reference) {
            $wallet = $this->getOrCreateWallet($userId);

            if ($wallet->balance < $amount) {
                throw new \InvalidArgumentException('Insufficient wallet balance.');
            }

            $newBalance = round($wallet->balance - $amount, 2);
            $wallet->update(['balance' => $newBalance]);

            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $newBalance,
                'reference' => $reference,
                'description' => "Wallet debit of {$amount}",
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
            $fromWallet = $this->getOrCreateWallet($fromUserId);
            $toWallet = $this->getOrCreateWallet($toUserId);

            if ($fromWallet->balance < $amount) {
                throw new \InvalidArgumentException('Insufficient wallet balance.');
            }

            $fromNewBalance = round($fromWallet->balance - $amount, 2);
            $toNewBalance = round($toWallet->balance + $amount, 2);

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

    public function getBalance(string $userId): float
    {
        $wallet = $this->getOrCreateWallet($userId);

        return (float) $wallet->balance;
    }

    private function getOrCreateWallet(string $userId): Wallet
    {
        return Wallet::firstOrCreate(
            ['user_id' => $userId],
            ['balance' => 0, 'currency' => config('app.currency', 'USD')]
        );
    }
}
