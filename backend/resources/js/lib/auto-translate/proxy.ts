import type { AutoTranslateResponse } from './types';

const ENDPOINT = '/api/i18n/auto-translate';
const MAX_BATCH = 40;
const MAX_BATCH_CHARS = 3500;
const MAX_TEXT_LENGTH = 1000;

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Split text under both the API text-count and character caps.
 * The server enforces the same limits; keeping chunks small bounds the
 * visual delay between a page paint and its translation.
 */
export function chunkTexts(texts: string[]): string[][] {
    const chunks: string[][] = [];
    let current: string[] = [];
    let chars = 0;

    for (const text of texts) {
        const length = text.length;

        if (
            current.length > 0 &&
            (current.length >= MAX_BATCH || chars + length > MAX_BATCH_CHARS)
        ) {
            chunks.push(current);
            current = [];
            chars = 0;
        }

        current.push(text);
        chars += length;
    }

    if (current.length > 0) {
        chunks.push(current);
    }

    return chunks;
}

/** Entries eligible for the proxy (the server rejects >1000 chars). */
export function translatable(text: string): boolean {
    const core = text.trim();

    return core.length > 0 && core.length <= MAX_TEXT_LENGTH;
}

/**
 * POST one batch to the Laravel proxy.
 *
 * Returns original -> translation (including identity mappings, so the
 * engine can cache "already correct" strings). Network/HTTP failures
 * return an empty map: the English text stays on screen.
 */
export async function translateBatch(
    texts: string[],
    target: string,
): Promise<Map<string, string>> {
    const translations = new Map<string, string>();

    if (texts.length === 0) {
        return translations;
    }

    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': xsrfToken(),
            },
            body: JSON.stringify({ target, texts }),
        });

        if (!response.ok) {
            return translations;
        }

        const payload = (await response.json()) as AutoTranslateResponse;
        const values = payload?.translations;

        if (!Array.isArray(values)) {
            return translations;
        }

        texts.forEach((text, index) => {
            const value = values[index];

            if (typeof value === 'string' && value.trim() !== '') {
                translations.set(text, value);
            }
        });
    } catch {
        // Offline / aborted / disabled: keep the source text.
    }

    return translations;
}
