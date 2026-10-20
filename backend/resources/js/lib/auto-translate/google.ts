/**
 * Path A: Google Translate Website Widget.
 *
 * Zero backend: loads Google's element.js, keeps a hidden mount slot,
 * and hides Google's chrome (banner, tooltip, highlight). Language
 * selection drives the widget's hidden <select>, with the classic
 * `googtrans` cookie as the reload-safe fallback.
 *
 * CSP: SecurityHeaders allows translate.google.com and
 * translate.googleapis.com for script/frame sources.
 */

const SLOT_ID = 'en-google-translate-slot';
const STYLE_ID = 'en-google-translate-style';
const SCRIPT_FLAG = 'data-en-google-translate';

declare global {
    interface Window {
        google?: {
            translate?: {
                TranslateElement?: new (
                    options: Record<string, unknown>,
                    elementId: string,
                ) => unknown;
            };
        };
        __everythingneedGoogleTranslateInit?: () => void;
    }
}

let loading = false;
let pending: string | null = null;
let retryTimer: number | null = null;

function ensureStyle(): void {
    if (document.getElementById(STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        .goog-te-banner-frame, .goog-te-banner-frame.skiptranslate,
        #goog-gt-tt, .goog-te-balloon-frame, .goog-te-spinner-pos,
        .skiptranslate > iframe { display: none !important; }
        body { top: 0 !important; }
        #${SLOT_ID} { display: none !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);
}

function ensureSlot(): void {
    if (document.getElementById(SLOT_ID)) {
        return;
    }

    const slot = document.createElement('div');
    slot.id = SLOT_ID;
    slot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(slot);
}

function setGoogtrans(value: string | null): void {
    const expires = value === null
        ? '; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        : '';
    const cookie = value === null ? '' : `/en/${value}`;

    document.cookie = `googtrans=${cookie}; path=/${expires}`;
    document.cookie = `googtrans=${cookie}; path=/; domain=${window.location.hostname}${expires}`;
}

function applyPending(): boolean {
    const combo = document.querySelector<HTMLSelectElement>('select.goog-te-combo');

    if (!combo || pending === null) {
        return false;
    }

    if (combo.value !== pending) {
        combo.value = pending;
        combo.dispatchEvent(new Event('change'));
    }

    pending = null;

    return true;
}

function retryApply(attempts = 20): void {
    if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
    }

    const tick = (left: number): void => {
        if (applyPending() || left <= 0) {
            retryTimer = null;
            return;
        }

        retryTimer = window.setTimeout(() => tick(left - 1), 250);
    };

    tick(attempts);
}

/** Load the widget once (idempotent). `pageLanguage` is the source. */
export function loadGoogleWidget(pageLanguage = 'en'): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return;
    }

    ensureStyle();
    ensureSlot();

    if (window.google?.translate?.TranslateElement) {
        retryApply();
        return;
    }

    if (loading) {
        return;
    }

    loading = true;

    window.__everythingneedGoogleTranslateInit = () => {
        loading = false;

        const Element = window.google?.translate?.TranslateElement;

        if (!Element) {
            return;
        }

        new Element(
            {
                pageLanguage,
                autoDisplay: false,
                multilanguagePage: true,
            },
            SLOT_ID,
        );

        retryApply();
    };

    if (document.querySelector(`script[${SCRIPT_FLAG}]`)) {
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=__everythingneedGoogleTranslateInit';
    script.async = true;
    script.setAttribute(SCRIPT_FLAG, 'true');
    script.onerror = () => {
        loading = false;
    };
    document.head.appendChild(script);
}

/** Select a target locale in the widget (or queue it until ready). */
export function setGoogleLanguage(code: string, source = 'en'): void {
    if (typeof document === 'undefined') {
        return;
    }

    if (code === source) {
        pending = null;
        setGoogtrans(null);

        if (
            document.documentElement.classList.contains('translated-ltr') ||
            document.documentElement.classList.contains('translated-rtl')
        ) {
            window.location.reload();
        }

        return;
    }

    pending = code;
    setGoogtrans(code);

    if (!applyPending()) {
        retryApply();
    }
}
