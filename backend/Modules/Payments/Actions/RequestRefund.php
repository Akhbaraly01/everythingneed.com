<?php

namespace Modules\Payments\Actions;

use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;
use Core\Services\Contracts\AuditServiceInterface;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;

/**
 * Gap 3 (spec 31/32): raise a refund REQUEST. No money moves here — the row
 * stays pending until support reviews it. Idempotent by idempotency_key, and
 * the amount is reserved against pending + approved + processed refunds so
 * two requests can never claim the same money.
 */
class RequestRefund
{
    public function __construct(
        private AuditServiceInterface $audit
    ) {}

    /**
     * @param array{payment_id:string, requested_by:string, amount?:float|null,
     *   reason?:string|null, idempotency_key?:string|null,
     *   cancellation_id?:string|null} $data
     */
    public function execute(array $data): object
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $payment = Payment::query()->lockForUpdate()->find($data['payment_id']);

            if (!$payment) {
                throw new NotFoundException('Payment', $data['payment_id']);
            }

            if (!in_array($payment->status, [Payment::STATUS_SUCCEEDED, Payment::STATUS_PARTIALLY_REFUNDED], true)) {
                throw new ValidationException('Payment is not refundable');
            }

            // Idempotent replay: the same key returns the original request.
            $key = $data['idempotency_key'] ?? null;
            if (is_string($key) && $key !== '') {
                $existing = Refund::where('idempotency_key', $key)->first();
                if ($existing) {
                    return $existing;
                }
            }

            // A pending request already open for the same source (return
            // request, cancelled order) is the request — never double-file.
            $cancellationId = $data['cancellation_id'] ?? null;
            if (is_string($cancellationId) && $cancellationId !== '') {
                $open = Refund::where('payment_id', $payment->id)
                    ->where('cancellation_id', $cancellationId)
                    ->whereIn('status', [Refund::STATUS_PENDING, Refund::STATUS_APPROVED])
                    ->first();
                if ($open) {
                    return $open;
                }
            }

            // Pending + approved requests reserve money just like processed
            // refunds, so chained partial requests stay inside the charge.
            $reserved = (float) Refund::where('payment_id', $payment->id)
                ->whereIn('status', [
                    Refund::STATUS_PENDING,
                    Refund::STATUS_APPROVED,
                    Refund::STATUS_COMPLETED,
                    Refund::STATUS_SUCCEEDED,
                ])
                ->sum('amount');

            $remaining = (float) $payment->amount - $reserved;
            $amount = $data['amount'] ?? $remaining;

            if ($amount <= 0 || $amount > $remaining + 0.0001) {
                throw new ValidationException('Refund amount exceeds the refundable balance');
            }

            $refund = Refund::create([
                'payment_id' => $payment->id,
                'requested_by' => $data['requested_by'],
                'amount' => round($amount, 2),
                // Same-method snapshot: payout always returns this way.
                'method' => $payment->method,
                'idempotency_key' => $key ?: null,
                'cancellation_id' => $cancellationId ?: null,
                'reason' => $data['reason'] ?? null,
                'requested_at' => now(),
                'status' => Refund::STATUS_PENDING,
            ]);

            try {
                $this->audit->log([
                    'action' => 'refund.requested',
                    'entity_type' => 'refund',
                    'entity_id' => $refund->id,
                    'performed_by' => $data['requested_by'],
                    'new_values' => [
                        'payment_id' => $payment->id,
                        'amount' => (float) $refund->amount,
                        'method' => $refund->method,
                        'status' => Refund::STATUS_PENDING,
                    ],
                ]);
            } catch (\Throwable) {
            }

            return $refund;
        });
    }
}
