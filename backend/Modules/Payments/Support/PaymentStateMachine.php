<?php

namespace Modules\Payments\Support;

use Modules\Payments\Entities\Payment;

/**
 * Spec 31 payment workflow: Pending -> Processing -> Succeeded -> (Partially)
 * Refunded, with Failed/Cancelled leaving the money path. Same-state writes
 * are idempotent (webhooks may repeat a terminal success). The legacy
 * 'completed' value stays terminal so old rows never transition.
 */
class PaymentStateMachine
{
    public const TRANSITIONS = [
        Payment::STATUS_PENDING => [
            Payment::STATUS_PROCESSING,
            Payment::STATUS_SUCCEEDED,
            Payment::STATUS_FAILED,
            Payment::STATUS_CANCELLED,
        ],
        Payment::STATUS_PROCESSING => [
            Payment::STATUS_PENDING,
            Payment::STATUS_SUCCEEDED,
            Payment::STATUS_FAILED,
            Payment::STATUS_CANCELLED,
        ],
        Payment::STATUS_SUCCEEDED => [
            Payment::STATUS_PARTIALLY_REFUNDED,
            Payment::STATUS_REFUNDED,
        ],
        Payment::STATUS_PARTIALLY_REFUNDED => [
            Payment::STATUS_PARTIALLY_REFUNDED,
            Payment::STATUS_REFUNDED,
        ],
        Payment::STATUS_FAILED => [],
        Payment::STATUS_CANCELLED => [],
        Payment::STATUS_REFUNDED => [],
        Payment::STATUS_COMPLETED => [],
    ];

    public static function canTransition(?string $from, string $to): bool
    {
        if ($from === null || $from === $to) {
            return true;
        }

        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }
}
