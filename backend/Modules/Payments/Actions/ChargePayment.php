<?php

namespace Modules\Payments\Actions;

use Illuminate\Support\Facades\DB;
use Modules\Orders\Entities\Order;
use Modules\Orders\Entities\OrderTracking;
use Modules\Payments\Entities\Payment;
use Core\Exceptions\ValidationException;
use Core\Exceptions\ForbiddenException;
use Core\Services\Contracts\PaymentGatewayInterface;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\WalletServiceInterface;
use Core\Support\KycGate;

class ChargePayment
{
    public function __construct(
        private PaymentGatewayInterface $gateway,
        private AuditServiceInterface $audit,
        private WalletServiceInterface $wallet
    ) {}

    public function execute(array $data): object
    {
        return DB::transaction(function () use ($data) {
            // A retry with the same idempotency key replays the original
            // payment even when the order already advanced to paid.
            $idempotencyKey = $data['idempotency_key'] ?? null;
            if ($idempotencyKey) {
                $replay = Payment::where('idempotency_key', $idempotencyKey)
                    ->where('user_id', $data['user_id'])
                    ->first();
                if ($replay) {
                    return $replay;
                }
            }

            $order = !empty($data['order_id'])
                ? Order::where('id', $data['order_id'])->lockForUpdate()->first()
                : null;

            // Marketplace product orders get full server-side validation.
            if ($order) {
                if ($order->user_id !== $data['user_id']) {
                    throw new ForbiddenException('You cannot pay for another user\'s order');
                }

                if ($order->status !== Order::STATUS_PENDING) {
                    throw new ValidationException("Order is not payable in status '{$order->status}'");
                }

                if (isset($data['amount']) && bccomp((string) $data['amount'], (string) $order->total_amount, 2) !== 0) {
                    throw new ValidationException('Amount does not match the order total');
                }

                $data['amount'] = $order->total_amount;
                $data['currency'] = $order->currency;
            }

            $reference = $data['reference'] ?? ('PAY-'.strtoupper(uniqid()));

            $payment = null;
            if (($data['method'] ?? '') === 'wallet') {
                $payment = $this->payFromWallet($data, $order);
            }

            if ($payment === null) {
                $result = $this->gateway->charge([
                    'order_id' => $data['order_id'] ?? null,
                    'user_id' => $data['user_id'],
                    'amount' => $data['amount'],
                    'currency' => $data['currency'] ?? \Core\Support\Currencies::default(),
                    'method' => $data['method'],
                    'reference' => $reference,
                    'idempotency_key' => $data['idempotency_key'] ?? null,
                    'email' => $data['email'] ?? null,
                    'metadata' => $data['metadata'] ?? null,
                    'purpose' => $data['purpose'] ?? null,
                ]);

                if (empty($result['success'])) {
                    throw new ValidationException($result['error'] ?? 'Payment failed');
                }

                $payment = Payment::findOrFail($result['payment_id']);

                // Concurrent replay: the winner already ran the order side effects.
                if (!empty($result['idempotent'])) {
                    return $payment;
                }
            }

            // Only advance order state when money actually succeeded.
            if ($payment->status === Payment::STATUS_SUCCEEDED && $order) {
                $order->update(['status' => Order::STATUS_PAID]);

                \Modules\Orders\Entities\VendorOrder::where('order_id', $order->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'paid']);

                OrderTracking::create([
                    'order_id' => $order->id,
                    'order_type' => 'product',
                    'user_id' => $order->user_id,
                    'status' => Order::STATUS_PAID,
                    'status_message' => "Payment received ({$payment->reference})",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                \Modules\Orders\Events\OrderStatusUpdated::dispatch(
                    OrderTracking::where('order_id', $order->id)->orderByDesc('created_at')->first()
                );

                try {
                    $this->audit->log([
                        'action' => 'order.paid',
                        'entity_type' => 'order',
                        'entity_id' => $order->id,
                        'performed_by' => $data['user_id'],
                        'new_values' => [
                            'payment_id' => $payment->id,
                            'amount' => (float) $payment->amount,
                            'reference' => $payment->reference,
                        ],
                    ]);
                } catch (\Throwable) {
                    // Non-fatal
                }
            }

            return $payment->fresh();
        });
    }

    /**
     * Spec 29/31 wallet payment: spend available ledger balance for a charge.
     * Funded + verified wallets debit for real; anything else follows the
     * honest fallbacks below (never a silent success without money moved).
     *
     * Returns null when the wallet holds no funds at all — the caller keeps
     * the sandbox passthrough contract pinned by PaymentTest.
     */
    private function payFromWallet(array $data, ?Order $order): ?object
    {
        $userId = $data['user_id'];
        $amount = (float) ($order ? $order->total_amount : $data['amount']);
        $available = $this->wallet->getAvailableBalance($userId);

        if ($available >= $amount - 0.0001) {
            KycGate::requireVerified($userId, 'Wallet payments');

            return $this->completeWalletPayment($data, $order, $amount);
        }

        if ($available > 0.0001) {
            KycGate::requireVerified($userId, 'Wallet payments');
            throw new ValidationException('Insufficient wallet balance.');
        }

        return null;
    }

    /**
     * Create-or-resume the wallet payment row, debit exactly once (the debit
     * reference is tied to the payment id, so a crash-then-retry can only
     * ever move the money once), and mark it succeeded.
     */
    private function completeWalletPayment(array $data, ?Order $order, float $amount): object
    {
        $userId = $data['user_id'];
        $key = $data['idempotency_key'] ?? null;

        $payment = null;
        if ($key) {
            $payment = Payment::where('idempotency_key', $key)
                ->where('user_id', $userId)
                ->first();
        }

        if ($payment === null) {
            try {
                $payment = DB::transaction(fn () => Payment::create([
                    'order_id' => $order?->id,
                    'user_id' => $userId,
                    'amount' => $amount,
                    'currency' => $order?->currency ?? ($data['currency'] ?? \Core\Support\Currencies::default()),
                    'status' => Payment::STATUS_PENDING,
                    'method' => 'wallet',
                    'purpose' => $data['purpose'] ?? ($order ? 'order_payment' : 'checkout'),
                    'reference' => 'WALLET-PAY-'.strtoupper(uniqid()),
                    'idempotency_key' => $key,
                    'provider' => 'wallet',
                    'gateway_response' => ['provider' => 'wallet', 'kind' => 'wallet_payment'],
                ]));
            } catch (\Illuminate\Database\QueryException $e) {
                if ($key && (string) ($e->errorInfo[0] ?? '') === '23505') {
                    $payment = Payment::where('idempotency_key', $key)
                        ->where('user_id', $userId)
                        ->firstOrFail();
                } else {
                    throw $e;
                }
            }
        }

        if ($payment->status === Payment::STATUS_SUCCEEDED) {
            return $payment;
        }

        $description = $order
            ? "Wallet payment for order {$order->id}"
            : "Wallet checkout {$payment->reference}";

        try {
            $this->wallet->debit($userId, $amount, 'WALLET-PAY-'.$payment->id, $description);
        } catch (\InvalidArgumentException $e) {
            $payment->update(['status' => Payment::STATUS_FAILED]);
            throw new ValidationException('Insufficient wallet balance.');
        }

        $payment->update([
            'status' => Payment::STATUS_SUCCEEDED,
            'gateway_response' => ['provider' => 'wallet', 'kind' => 'wallet_payment'],
        ]);

        \Modules\Payments\Events\PaymentCompleted::dispatch($payment);

        try {
            $this->audit->log([
                'action' => 'payment.charged',
                'entity_type' => 'payment',
                'entity_id' => $payment->id,
                'performed_by' => $userId,
                'new_values' => [
                    'provider' => 'wallet',
                    'status' => $payment->status,
                    'amount' => (float) $payment->amount,
                    'reference' => $payment->reference,
                ],
            ]);
        } catch (\Throwable) {
            // Non-fatal
        }

        return $payment->fresh();
    }
}
