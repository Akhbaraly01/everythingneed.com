import { describe, expect, it } from 'vitest';
import {
    NEED_STATUS_LABELS,
    acceptedOffer,
    needDetailUrl,
    needStatusClasses,
} from '@/lib/needs';
import type { NeedOffer, NeedRequestDetail } from '@/types';

function makeNeed(extra: Partial<NeedRequestDetail> = {}): NeedRequestDetail {
    return {
        id: 'need-1',
        user_id: 'user-1',
        request_number: 'NEED-1',
        title: 'Need a plumber',
        description: 'Burst pipe in the kitchen',
        status: 'published',
        created_at: '2026-10-01T00:00:00Z',
        ...extra,
    };
}

function makeOffer(extra: Partial<NeedOffer> = {}): NeedOffer {
    return {
        id: 'offer-1',
        provider_id: 'vendor-1',
        price: 120,
        status: 'pending',
        created_at: '2026-10-02T00:00:00Z',
        ...extra,
    };
}

describe('need status presentation', () => {
    it('labels every lifecycle state in human words', () => {
        expect(NEED_STATUS_LABELS.fulfilled).toBe('Delivered');
        expect(NEED_STATUS_LABELS.negotiating).toBe('Negotiation');
        expect(NEED_STATUS_LABELS.payment_pending).toBe('Payment pending');
    });

    it('buckets statuses into the documented pill colors', () => {
        expect(needStatusClasses('draft')).toContain('bg-gray-100');
        expect(needStatusClasses('published')).toContain('bg-blue-100');
        expect(needStatusClasses('payment_pending')).toContain('bg-amber-100');
        expect(needStatusClasses('in_progress')).toContain('bg-indigo-100');
        expect(needStatusClasses('completed')).toContain('bg-green-100');
        expect(needStatusClasses('disputed')).toContain('bg-orange-100');
        // Terminal failure bucket (cancelled/rejected/expired/...).
        expect(needStatusClasses('refunded')).toContain('bg-red-100');
    });
});

describe('need detail routing', () => {
    it('uses the category slug when present (spec S12)', () => {
        const need = makeNeed({
            category: { slug: 'cars' } as unknown as NeedRequestDetail['category'],
        });
        expect(needDetailUrl(need)).toBe('/needs/cars/need-1');
    });

    it('falls back to the generic requests path without a category', () => {
        expect(needDetailUrl(makeNeed())).toBe('/needs/requests/need-1');
        expect(
            needDetailUrl(makeNeed({ category: null }))
        ).toBe('/needs/requests/need-1');
    });
});

describe('accepted offer lookup', () => {
    it('returns the accepted offer, not the first row', () => {
        const offers = [
            makeOffer({ id: 'offer-1', status: 'pending' }),
            makeOffer({ id: 'offer-2', status: 'accepted' }),
            makeOffer({ id: 'offer-3', status: 'rejected' }),
        ];
        expect(acceptedOffer(makeNeed({ offers }))?.id).toBe('offer-2');
    });

    it('returns undefined while no offer is accepted', () => {
        expect(acceptedOffer(makeNeed())).toBeUndefined();
        expect(
            acceptedOffer(makeNeed({ offers: [makeOffer()] }))
        ).toBeUndefined();
    });
});
