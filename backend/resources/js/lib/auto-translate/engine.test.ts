import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoTranslator } from '@/lib/auto-translate/engine';

const translateBatch = vi.fn(async (texts: string[]) => {
    const map = new Map<string, string>();

    for (const text of texts) {
        map.set(text, `FR:${text}`);
    }

    return map;
});

vi.mock('@/lib/auto-translate/proxy', () => ({
    chunkTexts: (texts: string[]) => [texts],
    translateBatch: (texts: string[]) => translateBatch(texts),
    translatable: (text: string) => text.trim().length > 0,
}));

const config = { engine: 'proxy' as const, source: 'en' };

describe('AutoTranslator', () => {
    beforeEach(() => {
        translateBatch.mockClear();
        document.body.innerHTML = `
            <main>
                <h1>Hello world</h1>
                <p title="Tooltip text">Body copy</p>
                <span data-auto-translate="off">Leave me</span>
                <code>const x = 1;</code>
                <a href="/x">everythingneed.com</a>
                <span>fr</span>
                <span>E</span>
            </main>
        `;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('translates visible text and leaves skipped nodes untouched', async () => {
        vi.useFakeTimers();

        const translator = new AutoTranslator();
        translator.start(config, 'fr');

        await vi.advanceTimersByTimeAsync(500);

        expect(document.querySelector('h1')?.textContent).toBe('FR:Hello world');
        expect(document.querySelector('p')?.textContent).toBe('FR:Body copy');
        expect(document.querySelector('p')?.getAttribute('title')).toBe('FR:Tooltip text');
        expect(document.querySelector('[data-auto-translate="off"]')?.textContent).toBe('Leave me');
        expect(document.querySelector('code')?.textContent).toBe('const x = 1;');
        expect(document.querySelector('a')?.textContent).toBe('everythingneed.com');
        expect(document.querySelectorAll('span')[1]?.textContent).toBe('FR:fr');
        expect(document.querySelectorAll('span')[2]?.textContent).toBe('E');

        translator.stop();
    });

    it('restores the original text when switching back to the source locale', async () => {
        vi.useFakeTimers();

        const translator = new AutoTranslator();
        translator.start(config, 'fr');

        await vi.advanceTimersByTimeAsync(500);
        expect(document.querySelector('h1')?.textContent).toBe('FR:Hello world');

        translator.setTarget('en');
        await vi.advanceTimersByTimeAsync(500);

        expect(document.querySelector('h1')?.textContent).toBe('Hello world');
        expect(document.querySelector('p')?.getAttribute('title')).toBe('Tooltip text');

        translator.stop();
    });

    it('translates after switching away from the source locale', async () => {
        vi.useFakeTimers();

        const translator = new AutoTranslator();
        // The bridge boots on the source locale and switches later.
        translator.start(config, 'en');
        await vi.advanceTimersByTimeAsync(200);

        expect(translateBatch).not.toHaveBeenCalled();

        translator.setTarget('fr');
        await vi.advanceTimersByTimeAsync(500);

        expect(translateBatch).toHaveBeenCalled();
        expect(document.querySelector('h1')?.textContent).toBe('FR:Hello world');

        translator.stop();
    });

    it('keeps a single batch in flight and picks up later text', async () => {
        vi.useFakeTimers();

        const translator = new AutoTranslator();
        translator.start(config, 'fr');

        await vi.advanceTimersByTimeAsync(500);
        const callsAfterFirstBatch = translateBatch.mock.calls.length;

        // New text arrives while the first batch is being processed.
        document.body.insertAdjacentHTML('beforeend', '<p>Brand new copy</p>');
        await vi.advanceTimersByTimeAsync(500);

        expect(translateBatch.mock.calls.length).toBeGreaterThan(callsAfterFirstBatch);

        const sent = translateBatch.mock.calls.flatMap((call) => call[0] as string[]);

        expect(sent).toContain('Brand new copy');

        translator.stop();
    });

    it('does nothing when the target equals the source locale', async () => {
        vi.useFakeTimers();

        const translator = new AutoTranslator();
        translator.start(config, 'en');

        await vi.advanceTimersByTimeAsync(500);

        expect(translateBatch).not.toHaveBeenCalled();
        expect(document.querySelector('h1')?.textContent).toBe('Hello world');

        translator.stop();
    });
});
