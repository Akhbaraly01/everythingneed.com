/**
 * Whole-page translation progress signal.
 *
 * The engine (proxy) and the Google widget (Path A) both translate the
 * document in the background. The combined language/currency switcher
 * shows a spinner while this is "active", so the shopper sees that the
 * page is being converted instead of wondering why it still looks the
 * same.
 */
export const TRANSLATE_STATE_EVENT = 'everythingneed:translate-state';

export function broadcastTranslateState(active: boolean): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<{ active: boolean }>(TRANSLATE_STATE_EVENT, { detail: { active } }),
    );
}
