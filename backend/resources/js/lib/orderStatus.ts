/**
 * Mirror of Modules\Orders\Support\OrderStateMachine — the server stays the
 * authority (invalid transitions answer 422); this map only keeps the status
 * selects honest by offering legal destinations from the current state.
 */

/** Every status that exists on orders / vendor_orders (DB CHECK constraint). */
export const ORDER_STATUSES = [
    'pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered', 'completed',
    'cancelled', 'returned', 'refund_requested', 'refunded', 'disputed',
] as const;

/**
 * Statuses an admin may set (provider-owned 'paid' excluded; the RMA and
 * dispute states are customer/support driven, mirrors VALID_STATUSES server-side).
 */
export const SETTABLE_STATUSES = [
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed',
    'cancelled', 'refunded',
] as const;

const ORDER = ['pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
const TERMINAL = ['cancelled', 'refunded'];
const OUTCOMES = ['cancelled', 'refunded'];

export function canTransition(from: string, to: string): boolean {
    if (from === to) return true;
    if (TERMINAL.includes(from)) return false;
    if (OUTCOMES.includes(to)) return true;
    const fromIndex = ORDER.indexOf(from);
    const toIndex = ORDER.indexOf(to);
    return fromIndex !== -1 && toIndex !== -1 && toIndex > fromIndex;
}

/** Admin-settable destinations from a state (never includes 'paid'). */
export function settableOptionsFor(current: string): string[] {
    return SETTABLE_STATUSES.filter((to) => canTransition(current, to));
}
