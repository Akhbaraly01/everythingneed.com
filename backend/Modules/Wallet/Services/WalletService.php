<?php

namespace Modules\Wallet\Services;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Core\Exceptions\InsufficientFundsException;
use Core\Services\Contracts\PaymentGatewayInterface;
use Core\Services\Contracts\WalletServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletService
{
    public function __construct(
        private WalletServiceInterface $coreWallet,
        private PaymentGatewayInterface $gateway
    ) {}

    public function getWallet(string $userId): Wallet
    {
        return Wallet::firstOrCreate(
            ['user_id' => $userId],
            ['balance' => 0, 'currency' => \Core\Support\Currencies::default()]
        );
    }

    public function getTransactions(string $userId, int $page = 1, int $perPage = 15, ?string $type = null): object
    {
        $wallet = $this->getWallet($userId);

        $query = WalletTransaction::where('wallet_id', $wallet->id);
        if (in_array($type, ['credit', 'debit'], true)) {
            $query->where('type', $type);
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Deposit always routes through the payment abstraction first —
     * the wallet only credits on a succeeded gateway result.
     */
    public function deposit(string $userId, float $amount, string $paymentMethod, ?string $idempotencyKey = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw new \Core\Exceptions\ValidationException('Deposit amount must be positive');
        }

        $wallet = $this->getWallet($userId);

        $key = $idempotencyKey ?: ('WALLET-DEP-'.Str::uuid()->toString());
        $reference = 'WALLET-DEP-'.Str::upper(Str::random(16));

        $result = $this->gateway->charge([
            'order_id' => null,
            'user_id' => $userId,
            'amount' => $amount,
            'currency' => $wallet->currency ?: \Core\Support\Currencies::default(),
            'method' => $paymentMethod,
            'reference' => $reference,
            'idempotency_key' => $key,
            'purpose' => 'wallet_deposit',
            'metadata' => ['purpose' => 'wallet_deposit'],
        ]);

        if (empty($result['success'])) {
            throw new \Core\Exceptions\ValidationException(
                $result['error'] ?? 'Deposit payment failed'
            );
        }

        if (!empty($result['requires_verification'])) {
            throw new \Core\Exceptions\ValidationException(
                'Deposit is awaiting payment confirmation and will credit once verified.'
            );
        }

        $creditReference = $result['reference'] ?? $reference;

        $tx = $this->coreWallet->topUp($userId, $amount, $creditReference);
        $this->audit('wallet.deposit', $userId, $amount, $creditReference);
        $this->notify($userId, 'Wallet deposit received', "Your wallet was credited {$amount} USD.", 'wallet', $tx->id);

        return $tx;
    }

    public function withdraw(string $userId, float $amount, ?string $idempotencyKey = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw new \Core\Exceptions\ValidationException('Withdrawal amount must be positive');
        }

        $key = $idempotencyKey ?: ('WALLET-WDR-'.Str::uuid()->toString());
        // Deterministic reference from the idempotency key so Core's
        // (wallet_id, reference) unique + existence check short-circuits retries.
        $reference = 'WALLET-WDR-'.Str::upper(preg_replace('/[^A-Za-z0-9]/', '', $key) ?: Str::random(16));

        try {
            $tx = $this->coreWallet->debit($userId, $amount, $reference);
            $this->audit('wallet.withdraw', $userId, $amount, $reference);
            $this->notify($userId, 'Wallet withdrawal', "Your withdrawal of {$amount} USD was processed.", 'withdrawal', $tx->id);

            return $tx;
        } catch (\InvalidArgumentException $e) {
            if (str_contains($e->getMessage(), 'Insufficient')) {
                throw new InsufficientFundsException($amount, $this->coreWallet->getAvailableBalance($userId));
            }
            throw $e;
        }
    }

    public function transfer(string $fromUserId, string $toUserId, float $amount, ?string $reference = null): array
    {
        $ref = $reference ?: ('WALLET-TRF-'.Str::upper(Str::random(16)));

        try {
            $result = $this->coreWallet->transfer($fromUserId, $toUserId, $amount, $ref);
        } catch (\InvalidArgumentException $e) {
            // Spec: money-path domain failures answer 422, never 500.
            if (str_contains($e->getMessage(), 'Insufficient')) {
                throw new InsufficientFundsException($amount, $this->coreWallet->getAvailableBalance($fromUserId));
            }
            throw new \Core\Exceptions\ValidationException($e->getMessage());
        }
        $this->audit('wallet.transfer', $fromUserId, $amount, $ref, ['to_user_id' => $toUserId]);

        return $result;
    }

    public function availableBalance(string $userId): float
    {
        return $this->coreWallet->getAvailableBalance($userId);
    }

    public function holds(string $userId, int $page = 1, int $perPage = 15): object
    {
        return $this->coreWallet->listHolds($userId, $page, $perPage);
    }

    public function placeHold(
        string $userId,
        float $amount,
        string $reference,
        ?string $reason = null,
        ?string $orderId = null
    ): object {
        if ($amount <= 0) {
            throw new \Core\Exceptions\ValidationException('Hold amount must be positive');
        }

        try {
            $hold = $this->coreWallet->hold($userId, $amount, $reference, $reason, $orderId);
        } catch (\InvalidArgumentException $e) {
            throw new \Core\Exceptions\ValidationException($e->getMessage());
        }

        $this->audit('wallet.hold', $userId, $amount, $reference);

        return $hold;
    }

    public function release(string $userId, string $reference): object
    {
        try {
            $hold = $this->coreWallet->releaseHold($userId, $reference);
            $this->audit('wallet.hold.released', $userId, (float) $hold->amount, $reference);

            return $hold;
        } catch (\InvalidArgumentException $e) {
            throw new \Core\Exceptions\ValidationException($e->getMessage());
        }
    }

    public function capture(string $userId, string $reference): array
    {
        try {
            $result = $this->coreWallet->captureHold($userId, $reference);
            $this->audit('wallet.hold.captured', $userId, (float) $result['hold']->amount, $reference);

            return $result;
        } catch (\InvalidArgumentException $e) {
            // The core hold is untouched on failure; map to a 422 domain
            // error instead of leaking a 500 (previous code referenced an
            // undefined $result here).
            if (str_contains($e->getMessage(), 'Insufficient')) {
                $required = (float) (\App\Models\WalletHold::where('reference', $reference)->value('amount') ?? 0);
                throw new InsufficientFundsException(
                    $required,
                    $this->coreWallet->getAvailableBalance($userId)
                );
            }
            throw new \Core\Exceptions\ValidationException($e->getMessage());
        }
    }

    /**
     * Spec 29 refunds: money that left the wallet for a purchase comes back
     * to the wallet. Idempotent per refund id (topUp existence check).
     */
    public function refundToWallet(string $userId, float $amount, string $refundReference, string $description): WalletTransaction
    {
        if ($amount <= 0) {
            throw new \Core\Exceptions\ValidationException('Refund amount must be positive');
        }

        $tx = $this->coreWallet->topUp($userId, $amount, $refundReference, $description);
        $this->audit('wallet.refund', $userId, $amount, $refundReference);

        return $tx;
    }

    private function audit(string $action, string $userId, float $amount, string $reference, array $extra = []): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => $action,
                'entity_type' => 'wallet',
                'entity_id' => $userId,
                'performed_by' => $userId,
                'new_values' => [
                    'amount' => $amount,
                    'reference' => $reference,
                ] + $extra,
            ]);
        } catch (\Throwable) {
            // Audit must never break the money path.
        }
    }

    /** Spec 50 transactional fan-out; best-effort, never breaks money. */
    private function notify(string $userId, string $title, string $message, string $type, ?string $relatedId = null): void
    {
        try {
            app(\Core\Services\Contracts\NotificationServiceInterface::class)
                ->notify($userId, $title, $message, $type, $relatedId);
        } catch (\Throwable) {
        }
    }
}
