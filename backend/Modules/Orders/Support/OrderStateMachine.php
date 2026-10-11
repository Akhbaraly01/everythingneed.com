<?php

namespace Modules\Orders\Support;

/**
 * Vendor-order status state machine (W4).
 *
 * Forward-only through the lifecycle (pending → paid → confirmed →
 * processing → shipped → delivered); cancel/refund are reachable from any
 * active state; cancelled and refunded are terminal. Same-state updates are
 * idempotent no-ops. The FE mirrors this map in resources/js/lib/orderStatus
 * so the status selects only offer legal transitions — the server stays the
 * authority.
 */
final class OrderStateMachine
{
    /** Lifecycle order; 'paid' is provider-owned and can never be admin-set. */
    public const ORDER = ['pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];

    public const TERMINAL = ['cancelled', 'refunded'];

    /** Reachable from any active state. */
    public const OUTCOMES = ['cancelled', 'refunded'];

    public static function canTransition(string $from, string $to): bool
    {
        if ($from === $to) {
            return true;
        }

        if (in_array($from, self::TERMINAL, true)) {
            return false;
        }

        if (in_array($to, self::OUTCOMES, true)) {
            return true;
        }

        $fromIndex = array_search($from, self::ORDER, true);
        $toIndex = array_search($to, self::ORDER, true);

        return $fromIndex !== false && $toIndex !== false && $toIndex > $fromIndex;
    }

    /** Refunds apply to active orders only — never to cancelled/terminal rows. */
    public static function refundable(string $status): bool
    {
        return ! in_array($status, self::TERMINAL, true);
    }

    /**
     * Admin-settable destinations from a state ('paid' is provider-owned and
     * can never be admin-set — it is excluded here rather than in the
     * controller so the FE mirror and the API guard cannot drift).
     *
     * @return list<string>
     */
    public static function settableFrom(string $from): array
    {
        return array_values(array_filter(
            array_merge(self::ORDER, self::OUTCOMES),
            fn (string $to) => $to !== 'paid' && self::canTransition($from, $to),
        ));
    }
}
