<?php

namespace Modules\Payments\Services;

use Modules\Payments\Actions\ChargePayment;
use Modules\Payments\Actions\RefundPayment;
use Modules\Payments\Actions\RequestRefund;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;

class PaymentService
{
    public function __construct(
        private ChargePayment $chargePayment,
        private RefundPayment $refundPayment,
        private RequestRefund $requestRefundAction,
    ) {}

    public function charge(array $data): object
    {
        return $this->chargePayment->execute($data);
    }

    public function refund(string $paymentId, ?float $amount = null): object
    {
        return $this->refundPayment->execute($paymentId, $amount);
    }

    /**
     * Gap 3: the customer raises a refund REQUEST (pending, no money moves)
     * and support later reviews it. Idempotent via idempotency_key.
     */
    public function requestRefund(string $paymentId, string $userId, ?float $amount = null, ?string $reason = null, ?string $idempotencyKey = null): object
    {
        return $this->requestRefundAction->execute([
            'payment_id' => $paymentId,
            'requested_by' => $userId,
            'amount' => $amount,
            'reason' => $reason,
            'idempotency_key' => $idempotencyKey,
        ]);
    }

    /** The customer's own refund requests with payment context. */
    public function myRefunds(string $userId, int $page = 1, int $perPage = 15): object
    {
        return Refund::query()
            ->whereHas('payment', fn ($q) => $q->where('user_id', $userId))
            ->with('payment:id,reference,method,amount,status,currency')
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function getPayment(string $paymentId): ?Payment
    {
        return Payment::with(['refunds'])->find($paymentId);
    }

    public function getUserPayments(string $userId, int $page = 1, int $perPage = 15): object
    {
        return Payment::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }
}
