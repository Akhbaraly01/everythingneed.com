import { describe, expect, it } from 'vitest';
import { ORDER_STATUSES, canTransition, settableOptionsFor } from '@/lib/orderStatus';

describe('order status transition mirror', () => {
    it('allows forward movement along the fulfilment chain', () => {
        expect(canTransition('pending', 'paid')).toBe(true);
        expect(canTransition('paid', 'confirmed')).toBe(true);
        expect(canTransition('processing', 'delivered')).toBe(true);
    });

    it('blocks backwards movement except cancel/refund outcomes', () => {
        expect(canTransition('paid', 'pending')).toBe(false);
        expect(canTransition('shipped', 'processing')).toBe(false);
        // Customer/support outcomes are always reachable from live states.
        expect(canTransition('processing', 'cancelled')).toBe(true);
        expect(canTransition('delivered', 'refunded')).toBe(true);
    });

    it('treats terminal states as final and same-state as a no-op', () => {
        expect(canTransition('cancelled', 'paid')).toBe(false);
        expect(canTransition('refunded', 'confirmed')).toBe(false);
        expect(canTransition('pending', 'pending')).toBe(true);
        expect(canTransition('pending', 'not-a-status')).toBe(false);
    });
});

describe('admin settable options', () => {
    it('never offers the provider-owned paid state', () => {
        for (const status of ORDER_STATUSES) {
            expect(settableOptionsFor(status)).not.toContain('paid');
        }
    });

    it('offers only legal forward destinations', () => {
        // Forward jumps are legal (any later fulfilment state)...
        const options = settableOptionsFor('pending');
        expect(options).toContain('confirmed');
        expect(options).toContain('shipped');
        expect(options).not.toContain('paid');
        // ...but never backwards.
        const fromShipped = settableOptionsFor('shipped');
        expect(fromShipped).toContain('delivered');
        expect(fromShipped).not.toContain('processing');
        expect(fromShipped).not.toContain('pending');
        // Terminal state: nothing but itself.
        expect(settableOptionsFor('cancelled')).toEqual(['cancelled']);
    });
});
