import { describe, expect, it } from 'vitest';
import {
    LIFECYCLES,
    nextStatuses,
    statusLabel,
    statusTone,
} from '@/lib/lifecycle';

describe('status tones', () => {
    it('maps canonical statuses to their pill tones', () => {
        expect(statusTone('paid')).toContain('bg-cyan-100');
        expect(statusTone('completed')).toContain('bg-green-100');
        expect(statusTone('cancelled')).toContain('bg-red-100');
    });

    it('falls back to a neutral pill for unknown or empty values', () => {
        expect(statusTone('made_up_status')).toBe('bg-gray-100 text-gray-600');
        expect(statusTone(null)).toBe('bg-gray-100 text-gray-600');
        expect(statusTone(undefined)).toBe('bg-gray-100 text-gray-600');
    });
});

describe('status labels', () => {
    it('uses explicit overrides before title-casing', () => {
        expect(statusLabel('in_progress')).toBe('In Progress');
        expect(statusLabel('refund_requested')).toBe('Refund Requested');
        expect(statusLabel('succeeded')).toBe('Succeeded');
    });

    it('title-cases snake_case labels and handles empties', () => {
        expect(statusLabel('payment_pending')).toBe('Payment Pending');
        expect(statusLabel('refunded')).toBe('Refunded');
        expect(statusLabel(null)).toBe('-');
        expect(statusLabel('')).toBe('-');
    });
});

describe('lifecycle chains', () => {
    it('exposes the canonical order chain', () => {
        expect(LIFECYCLES.order[0]).toBe('pending');
        expect(LIFECYCLES.order.at(-1)).toBe('completed');
    });

    it('computes the single legal next step', () => {
        expect(nextStatuses('order', 'pending')).toEqual(['confirmed']);
        expect(nextStatuses('delivery', 'picked_up')).toEqual(['in_transit']);
    });

    it('returns nothing for terminal steps or unknown domains', () => {
        expect(nextStatuses('order', 'completed')).toEqual([]);
        expect(nextStatuses('order', 'cancelled')).toEqual([]);
        expect(nextStatuses('order', 'not-a-status')).toEqual([]);
        expect(nextStatuses('not-a-domain', 'pending')).toEqual([]);
    });
});
