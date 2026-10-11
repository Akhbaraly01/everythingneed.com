<?php

namespace Modules\Payments\Actions;

use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;
use Core\Services\Contracts\AuditServiceInterface;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;

/**
 * Gap 3 support review queue: approve a pending refund REQUEST (money then
 * moves via the SAME method the customer paid with) or reject it with a
 * reason. Only pending requests can be decided; decisions are idempotent
 * (a second decide on a non-pending row is a 422, never a double payout).
 */
class ReviewRefund
{
    public function __construct(
        private RefundPayment $refundPayment,
        private AuditServiceInterface $audit
    ) {}

    public function execute(string $refundId, string $reviewerId, string $decision, ?string $reason = null, ?float $amount = null): object
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($refundId, $reviewerId, $decision, $reason, $amount) {
            $refund = Refund::query()->lockForUpdate()->find($refundId);

            if (!$refund) {
                throw new NotFoundException('Refund', $refundId);
            }

            if ($refund->status !== Refund::STATUS_PENDING) {
                throw new ValidationException('Refund request has already been reviewed');
            }

            if ($decision === 'reject') {
                $refund->update([
                    'status' => Refund::STATUS_REJECTED,
                    'reviewed_by' => $reviewerId,
                    'reviewed_at' => now(),
                    'rejection_reason' => $reason,
                ]);

                $this->auditRefund('refund.rejected', $refund, $reviewerId, [
                    'status' => Refund::STATUS_REJECTED,
                    'rejection_reason' => $reason,
                ]);

                return $refund->fresh();
            }

            if ($decision !== 'approve') {
                throw new ValidationException('Decision must be approve or reject');
            }

            // Approve first (the row is now a reviewed request), then move
            // money via the original payment method.
            $refund->update([
                'status' => Refund::STATUS_APPROVED,
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
            ]);

            $this->auditRefund('refund.approved', $refund, $reviewerId, [
                'status' => Refund::STATUS_APPROVED,
                'amount' => (float) ($amount ?? $refund->amount),
            ]);

            $payment = Payment::find($refund->payment_id);
            if (!$payment) {
                throw new NotFoundException('Payment', $refund->payment_id);
            }

            // Same-method payout: wallet-backed refunds credit the ledger,
            // everything else goes back through the original gateway method.
            $this->refundPayment->execute($payment->id, $amount, $refund);

            return $refund->fresh();
        });
    }

    private function auditRefund(string $action, Refund $refund, string $actorId, array $newValues): void
    {
        try {
            $this->audit->log([
                'action' => $action,
                'entity_type' => 'refund',
                'entity_id' => $refund->id,
                'performed_by' => $actorId,
                'old_values' => ['status' => Refund::STATUS_PENDING],
                'new_values' => $newValues,
            ]);
        } catch (\Throwable) {
        }
    }
}
