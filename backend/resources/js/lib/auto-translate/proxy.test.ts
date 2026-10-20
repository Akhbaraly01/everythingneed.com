import { afterEach, describe, expect, it, vi } from 'vitest';
import { chunkTexts, translateBatch, translatable } from '@/lib/auto-translate/proxy';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('chunkTexts', () => {
    it('splits on the 40 text batch cap', () => {
        const texts = Array.from({ length: 41 }, (_, index) => `text ${index}`);
        const chunks = chunkTexts(texts);

        expect(chunks).toHaveLength(2);
        expect(chunks[0]).toHaveLength(40);
        expect(chunks[1]).toEqual(['text 40']);
    });

    it('splits on the character budget and keeps order', () => {
        const texts = ['a'.repeat(1000), 'b'.repeat(1000), 'c'.repeat(1000), 'd'.repeat(1000)];

        expect(chunkTexts(texts)).toEqual([
            [texts[0], texts[1], texts[2]],
            [texts[3]],
        ]);
    });

    it('keeps a single oversized text in its own chunk', () => {
        expect(chunkTexts(['x'.repeat(4000)])).toEqual([['x'.repeat(4000)]]);
        expect(chunkTexts([])).toEqual([]);
    });
});

describe('translatable', () => {
    it('rejects blank and over-long strings', () => {
        expect(translatable('   ')).toBe(false);
        expect(translatable('a'.repeat(1001))).toBe(false);
        expect(translatable('Hello')).toBe(true);
        expect(translatable('a'.repeat(1000))).toBe(true);
    });
});

describe('translateBatch', () => {
    it('posts the batch and maps aligned results, including identity', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ translations: ['Bonjour', 'Hello', '', 'Salut'] }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await translateBatch(['Hello', 'Hello World', 'Blank', 'Hi'], 'fr');
        const [url, init] = fetchMock.mock.calls[0];

        expect(url).toBe('/api/i18n/auto-translate');
        expect(JSON.parse(init.body)).toEqual({
            target: 'fr',
            texts: ['Hello', 'Hello World', 'Blank', 'Hi'],
        });
        expect(Object.fromEntries(result)).toEqual({
            Hello: 'Bonjour',
            'Hello World': 'Hello',
            Hi: 'Salut',
        });
    });

    it('returns an empty map for HTTP failures, malformed payloads and network errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
        expect((await translateBatch(['Hello'], 'fr')).size).toBe(0);

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
        expect((await translateBatch(['Hello'], 'fr')).size).toBe(0);

        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        expect((await translateBatch(['Hello'], 'fr')).size).toBe(0);

        expect((await translateBatch([], 'fr')).size).toBe(0);
    });
});
