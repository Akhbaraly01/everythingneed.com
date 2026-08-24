<?php

namespace Modules\Payments\Services;

use Modules\Payments\Actions\ChargePayment;
use Modules\Payments\Actions\RefundPayment;
use Modules\Payments\Entities\Payment;

class PaymentService
{
    public function __construct(
        private ChargePayment $chargePayment,
        private RefundPayment $refundPayment,
    ) {}

    public function charge(array $data): object
    {
        return $this->chargePayment->execute($data);
    }

    public function refund(string $paymentId, ?float $amount = null): object
    {
        return $this->refundPayment->execute($paymentId, $amount);
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
