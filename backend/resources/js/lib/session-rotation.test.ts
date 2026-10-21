import { describe, expect, it } from 'vitest';
import { rotate } from '@/lib/session-rotation';

describe('rotate', () => {
    it('keeps every item and is deterministic for a seed', () => {
        const items = [1, 2, 3, 4, 5];

        const first = rotate(items, 42);
        const second = rotate(items, 42);

        expect(first).toEqual(second);
        expect([...first].sort((a, b) => a - b)).toEqual(items);
    });

    it('produces a different order for a different salt', () => {
        const items = [1, 2, 3, 4, 5, 6, 7, 8];

        expect(rotate(items, 42, 1)).not.toEqual(rotate(items, 42, 2));
    });

    it('leaves short lists untouched', () => {
        expect(rotate([], 7)).toEqual([]);
        expect(rotate(['only'], 7)).toEqual(['only']);
    });
});
