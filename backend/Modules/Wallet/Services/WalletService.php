<?php

namespace Modules\Wallet\Services;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Core\Exceptions\InsufficientFundsException;
use Illuminate\Support\Facades\DB;

class WalletService
{
    public function getWallet(string $userId): Wallet
    {
        return Wallet::firstOrCreate(
            ['user_id' => $userId],
            ['balance' => 0, 'currency' => 'USD']
        );
    }

    public function getTransactions(string $userId, int $page = 1, int $perPage = 15): object
    {
        $wallet = $this->getWallet($userId);

        return WalletTransaction::where('wallet_id', $wallet->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function deposit(string $userId, float $amount, string $paymentMethod): WalletTransaction
    {
        return DB::transaction(function () use ($userId, $amount, $paymentMethod) {
            $wallet = Wallet::where('user_id', $userId)->lockForUpdate()->first()
                ?? $this->getWallet($userId);

            if ($amount <= 0) {
                throw new \Core\Exceptions\ValidationException('Deposit amount must be positive');
            }

            $wallet->balance = $wallet->balance + $amount;
            $wallet->save();

            return WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_after' => $wallet->balance,
                'description' => "Deposit via {$paymentMethod}",
                'reference' => 'deposit',
                'created_at' => now(),
            ]);
        });
    }

    public function withdraw(string $userId, float $amount): WalletTransaction
    {
        return DB::transaction(function () use ($userId, $amount) {
            $wallet = Wallet::where('user_id', $userId)->lockForUpdate()->first();

            if (!$wallet) {
                throw new InsufficientFundsException();
            }

            if ($amount <= 0) {
                throw new \Core\Exceptions\ValidationException('Withdrawal amount must be positive');
            }

            if ((float) $wallet->balance < $amount) {
                throw new InsufficientFundsException();
            }

            $wallet->balance = $wallet->balance - $amount;
            $wallet->save();

            return WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $wallet->balance,
                'description' => 'Withdrawal',
                'reference' => 'withdrawal',
                'created_at' => now(),
            ]);
        });
    }

    public function transfer(string $fromUserId, string $toUserId, float $amount): array
    {
        // Single atomic transaction: both legs succeed or neither does.
        return DB::transaction(function () use ($fromUserId, $toUserId, $amount) {
            $debit = $this->withdraw($fromUserId, $amount);
            $credit = $this->deposit($toUserId, $amount, 'transfer');

            return ['debit' => $debit, 'credit' => $credit];
        });
    }
}
