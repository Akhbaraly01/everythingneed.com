<?php

namespace Modules\Payments\Actions;

use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;
use App\Models\WalletTransaction;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;
use Core\Services\Contracts\PaymentGatewayInterface;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\WalletServiceInterface;

class RefundPayment
{
    public function __construct(
        private PaymentGatewayInterface $gateway,
        private AuditServiceInterface $audit,
        private WalletServiceInterface $coreWallet
    ) {}

    /**
     * Move money back to the customer. When `$request` is given (Gap 3), it
     * is an approved refund REQUEST — process that row in place (same-method)
     * instead of creating a second refund for the same money.
     */
    public function execute(string $paymentId, ?float $amount = null, ?Refund $request = null): object
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($paymentId, $amount, $request) {
            $payment = Payment::query()->lockForUpdate()->find($paymentId);

            if (!$payment) {
                throw new NotFoundException('Payment', $paymentId);
            }

            // Chained partial refunds stay allowed until the charge is fully
            // returned; anything else (pending/failed/refunded) cannot refund.
            if (!in_array($payment->status, [Payment::STATUS_SUCCEEDED, Payment::STATUS_PARTIALLY_REFUNDED], true)) {
                throw new ValidationException('Payment cannot be refunded');
            }

            if ($request !== null && $request->payment_id !== $payment->id) {
                throw new ValidationException('Refund request belongs to a different payment');
            }

            if ($request !== null && !in_array($request->status, [Refund::STATUS_PENDING, Refund::STATUS_APPROVED], true)) {
                throw new ValidationException('Refund request has already been processed');
            }

            $refundAmount = $amount ?? (float) ($request?->amount ?? $payment->amount);

            $alreadyRefunded = (float) Refund::where('payment_id', $payment->id)
                ->whereIn('status', ['succeeded', 'completed'])
                ->sum('amount');

            if ($alreadyRefunded + $refundAmount > (float) $payment->amount + 0.0001) {
                throw new ValidationException('Refund amount exceeds payment amount');
            }

            $fullyRefunded = $alreadyRefunded + $refundAmount >= (float) $payment->amount - 0.0001;

            // Spec 29 refunds: a wallet-backed payment moved ledger money, so
            // the refund credits the ledger back instead of calling a gateway
            // that never saw the funds.
            $walletBacked = $payment->method === 'wallet'
                && $payment->provider === 'wallet'
                && WalletTransaction::where('reference', 'WALLET-PAY-'.$payment->id)
                    ->where('type', 'debit')
                    ->exists();

            if ($walletBacked) {
                $refund = $request ?? Refund::create([
                    'payment_id' => $payment->id,
                    'amount' => $refundAmount,
                    'reason' => 'Marketplace refund',
                    'status' => Refund::STATUS_COMPLETED,
                    'gateway_response' => ['provider' => 'wallet', 'note' => 'ledger release'],
                ]);
                $refund->update([
                    'amount' => $refundAmount,
                    'status' => Refund::STATUS_COMPLETED,
                    'gateway_response' => ['provider' => 'wallet', 'note' => 'ledger release'],
                ]);

                $this->coreWallet->topUp(
                    $payment->user_id,
                    $refundAmount,
                    'WALLET-REF-'.$refund->id,
                    "Refund for {$payment->reference}"
                );

                try {
                    $this->audit->log([
                        'action' => 'wallet.refund',
                        'entity_type' => 'wallet',
                        'entity_id' => $payment->user_id,
                        'performed_by' => $payment->user_id,
                        'new_values' => [
                            'amount' => $refundAmount,
                            'reference' => 'WALLET-REF-'.$refund->id,
                            'payment_id' => $payment->id,
                        ],
                    ]);
                } catch (\Throwable) {
                }
            } else {
                $result = $this->gateway->refund([
                    'payment_id' => $payment->id,
                    'amount' => $refundAmount,
                    'reason' => 'Marketplace refund',
                    // Gap 3: process the approved request row in place.
                    'refund_id' => $request?->id,
                ]);

                if (empty($result['success'])) {
                    throw new ValidationException($result['error'] ?? 'Refund failed');
                }

                $refund = Refund::find($result['refund_id']);
                if (!$refund) {
                    throw new ValidationException('Refund record missing after gateway call');
                }

                // Keep historical status vocabulary used by existing tests/UI.
                if (($result['status'] ?? '') === 'succeeded') {
                    $refund->update(['status' => Refund::STATUS_COMPLETED]);
                }
            }

            $payment->update([
                'status' => $fullyRefunded
                    ? Payment::STATUS_REFUNDED
                    : Payment::STATUS_PARTIALLY_REFUNDED,
            ]);

        try {
            $this->audit->log([
                'action' => 'payment.refunded',
                'entity_type' => 'payment',
                'entity_id' => $payment->id,
                'performed_by' => null,
                'new_values' => [
                    'refund_id' => $refund->id,
                    'amount' => $refundAmount,
                    'status' => $refund->status,
                ],
            ]);
        } catch (\Throwable) {
        }

        // Marketplace product orders: mark refunded and restock.
        $order = $payment->order_id
            ? \Modules\Orders\Entities\Order::with('items')->find($payment->order_id)
            : null;

        if ($order && $fullyRefunded) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        \Modules\Products\Entities\Product::where('id', $item->product_id)
                            ->increment('stock_quantity', $item->quantity);
                    }
                }

                $order->update(['status' => \Modules\Orders\Entities\Order::STATUS_REFUNDED]);

                \Modules\Orders\Entities\OrderTracking::create([
                    'order_id' => $order->id,
                    'order_type' => 'product',
                    'user_id' => $order->user_id,
                    'status' => \Modules\Orders\Entities\Order::STATUS_REFUNDED,
                    'status_message' => 'Order refunded — stock restored',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                \Modules\Orders\Events\OrderStatusUpdated::dispatch(
                    \Modules\Orders\Entities\OrderTracking::where('order_id', $order->id)
                        ->orderByDesc('created_at')->first()
                );
            });
        }

        return $refund->fresh();
        });
    }
}
