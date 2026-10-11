import { describe, expect, it } from 'vitest';
import { isImageItem, libraryUrl } from '@/lib/media';

describe('libraryUrl', () => {
    it('serves public-disk items under /storage', () => {
        expect(libraryUrl({ disk: 'public', path: 'library/a.png' })).toBe(
            '/storage/library/a.png'
        );
    });

    it('passes through absolute and remote paths untouched', () => {
        expect(libraryUrl({ disk: 'local', path: '/already/absolute.png' })).toBe(
            '/already/absolute.png'
        );
        expect(
            libraryUrl({ disk: 'public', path: 'https://cdn.example.com/a.png' })
        ).toBe('https://cdn.example.com/a.png');
    });

    it('returns private-disk paths as stored (no public guessing)', () => {
        expect(libraryUrl({ disk: 'local', path: 'private/doc.pdf' })).toBe(
            'private/doc.pdf'
        );
    });
});

describe('isImageItem', () => {
    it('recognises image mime types only', () => {
        expect(isImageItem({ mime_type: 'image/png' })).toBe(true);
        expect(isImageItem({ mime_type: 'image/svg+xml' })).toBe(true);
        expect(isImageItem({ mime_type: 'application/pdf' })).toBe(false);
        expect(isImageItem({ mime_type: 'text/plain' })).toBe(false);
    });
});
