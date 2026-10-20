import { chunkTexts, translateBatch } from './proxy';
import type { AutoTranslateConfig } from './types';

const TEXT_SKIP_SELECTOR = 'script,style,noscript,code,pre,textarea,svg,canvas,iframe';
const ATTR_SKIP_SELECTOR = 'script,style,noscript,code,pre,svg,canvas,iframe';
const EXCLUDED_SELECTOR = [
    '[translate="no"]',
    '[data-no-translate]',
    '[data-auto-translate="off"]',
    '.notranslate',
    '.skiptranslate',
    '[contenteditable="true"]',
    '[contenteditable=""]',
].join(',');

const ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'] as const;

const LETTER = /\p{L}/u;
const URL_ONLY = /^(?:https?:\/\/|mailto:|tel:|\/\/)\S+$/i;

const MAX_TEXT = 1000;
const FLUSH_DELAY = 120;
const RESCAN_DELAY = 80;
const CACHE_LIMIT = 5000;

type AttrName = (typeof ATTRIBUTES)[number];

interface Parts {
    lead: string;
    core: string;
    trail: string;
}

/** Split whitespace so layout text keeps its spacing after replacement. */
function parts(text: string): Parts | null {
    const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/);

    if (!match) {
        return null;
    }

    const core = match[2];

    if (
        core === '' ||
        core.length > MAX_TEXT ||
        !LETTER.test(core) ||
        URL_ONLY.test(core)
    ) {
        return null;
    }

    return { lead: match[1], core, trail: match[3] };
}

/**
 * Path B: DOM translation engine.
 *
 * Walks text nodes and the user-visible attributes, batches unseen
 * strings to the Laravel proxy, caches translations client-side, and
 * re-applies them across React/Inertia re-renders via a MutationObserver.
 * Originals are tracked per node so switching back to the source locale
 * restores the exact React-rendered text.
 */
export class AutoTranslator {
    private config: AutoTranslateConfig | null = null;
    private started = false;
    private target = '';
    private source = 'en';

    private observer: MutationObserver | null = null;
    private textOriginals = new Map<Text, string>();
    private attrOriginals = new Map<Element, Map<AttrName, string>>();
    private cache = new Map<string, string>();
    private pending = new Set<string>();
    private inflight = new Set<string>();
    private recentNodes = new Set<Node>();
    private recentAttrs = new Set<Element>();

    private flushTimer: number | null = null;
    private rescanTimer: number | null = null;
    private clearTimer: number | null = null;
    private startTimer: number | null = null;
    private generation = 0;

    start(config: AutoTranslateConfig, target: string): void {
        if (typeof document === 'undefined') {
            return;
        }

        if (config.engine !== 'proxy') {
            this.stop();
            return;
        }

        this.config = config;
        this.started = true;
        this.source = (config.source || 'en').toLowerCase();
        this.target = target.toLowerCase();

        this.observe();

        if (this.target === this.source) {
            this.restore();
            return;
        }

        if (this.startTimer !== null) {
            window.clearTimeout(this.startTimer);
        }

        // Give the i18next dictionary a beat to paint the target locale
        // before the first scan, so already-translated UI strings are
        // not sent to the proxy unnecessarily.
        this.startTimer = window.setTimeout(() => {
            this.startTimer = null;
            this.translatePage();
        }, RESCAN_DELAY);
    }

    setTarget(target: string): void {
        if (!this.started) {
            return;
        }

        target = target.toLowerCase();

        if (target === this.target) {
            return;
        }

        this.target = target;
        this.generation++;
        this.pending.clear();
        this.inflight.clear();

        if (this.startTimer !== null) {
            window.clearTimeout(this.startTimer);
            this.startTimer = null;
        }

        if (target === this.source) {
            this.restore();
            return;
        }

        this.observe();
        this.translatePage();
    }

    /** Re-scan after Inertia navigations/updates. */
    rescan(): void {
        if (!this.started || this.target === this.source) {
            return;
        }

        this.observe();
        this.prune();
        this.translatePage();
    }

    stop(): void {
        this.started = false;
        this.observer?.disconnect();
        this.observer = null;
        this.restore();
        this.cache.clear();
        this.pending.clear();
        this.inflight.clear();
        this.generation++;

        for (const timer of [this.flushTimer, this.rescanTimer, this.startTimer]) {
            if (timer !== null) {
                window.clearTimeout(timer);
            }
        }

        this.flushTimer = null;
        this.rescanTimer = null;
        this.startTimer = null;
    }

    private observe(): void {
        if (this.observer !== null || typeof MutationObserver === 'undefined' || !document.body) {
            return;
        }

        this.observer = new MutationObserver((records) => this.onMutations(records));
        this.observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: [...ATTRIBUTES],
        });
    }

    private onMutations(records: MutationRecord[]): void {
        if (!this.started || this.target === this.source) {
            return;
        }

        let dirty = false;

        for (const record of records) {
            if (record.type === 'characterData') {
                const node = record.target as Text;

                if (this.recentNodes.has(node)) {
                    continue;
                }

                // React (or i18next) wrote fresh text: treat as the new
                // original and translate it.
                this.textOriginals.delete(node);
                const original = node.data;
                const split = parts(original);

                if (split) {
                    this.textOriginals.set(node, original);
                    this.enqueue(split.core);
                }

                dirty = true;
            } else if (record.type === 'childList') {
                if (record.addedNodes.length > 0) {
                    dirty = true;
                }
            } else if (record.type === 'attributes') {
                const el = record.target as Element;

                if (this.recentAttrs.has(el)) {
                    continue;
                }

                const attr = record.attributeName as AttrName;

                if (!ATTRIBUTES.includes(attr)) {
                    continue;
                }

                const map = this.attrOriginals.get(el) ?? new Map<AttrName, string>();
                map.delete(attr);

                const value = el.getAttribute(attr);

                if (value) {
                    const split = parts(value);

                    if (split) {
                        map.set(attr, value);
                        this.enqueue(split.core);
                    }
                }

                if (map.size > 0) {
                    this.attrOriginals.set(el, map);
                } else {
                    this.attrOriginals.delete(el);
                }

                dirty = true;
            }
        }

        if (dirty) {
            this.scheduleRescan();
        }
    }

    private scheduleRescan(): void {
        if (this.rescanTimer !== null) {
            return;
        }

        this.rescanTimer = window.setTimeout(() => {
            this.rescanTimer = null;
            this.prune();
            this.translatePage();
        }, RESCAN_DELAY);
    }

    private translatePage(): void {
        if (!this.started || this.target === this.source) {
            return;
        }

        const body = document.body;

        if (!body) {
            return;
        }

        this.prune();

        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
        let next = walker.nextNode();

        while (next !== null) {
            const node = next as Text;
            next = walker.nextNode();

            const parent = node.parentElement;

            if (
                !parent ||
                this.recentNodes.has(node) ||
                parent.closest(TEXT_SKIP_SELECTOR) ||
                parent.closest(EXCLUDED_SELECTOR)
            ) {
                continue;
            }

            let original = this.textOriginals.get(node);

            if (original === undefined) {
                const split = parts(node.data);

                if (!split) {
                    continue;
                }

                original = node.data;
                this.textOriginals.set(node, original);
            }

            const split = parts(original);

            if (!split) {
                continue;
            }

            const hit = this.cache.get(this.key(split.core));

            if (hit === undefined) {
                this.enqueue(split.core);
                continue;
            }

            const value = split.lead + hit + split.trail;

            if (node.data !== value) {
                this.writeText(node, value);
            }
        }

        for (const el of body.querySelectorAll<HTMLElement>('[placeholder],[aria-label],[title],[alt]')) {
            if (
                this.recentAttrs.has(el) ||
                el.closest(ATTR_SKIP_SELECTOR) ||
                el.closest(EXCLUDED_SELECTOR)
            ) {
                continue;
            }

            let map = this.attrOriginals.get(el);

            for (const attr of ATTRIBUTES) {
                if (!el.hasAttribute(attr)) {
                    continue;
                }

                let original = map?.get(attr);

                if (original === undefined) {
                    const value = el.getAttribute(attr) ?? '';
                    const split = parts(value);

                    if (!split) {
                        continue;
                    }

                    map = map ?? new Map<AttrName, string>();
                    map.set(attr, value);
                    this.attrOriginals.set(el, map);
                    original = value;
                }

                const split = parts(original);

                if (!split) {
                    continue;
                }

                const hit = this.cache.get(this.key(split.core));

                if (hit === undefined) {
                    this.enqueue(split.core);
                    continue;
                }

                const value = split.lead + hit + split.trail;

                if ((el.getAttribute(attr) ?? '') !== value) {
                    this.writeAttr(el, attr, value);
                }
            }
        }
    }

    private enqueue(text: string): void {
        if (this.cache.has(this.key(text)) || this.inflight.has(text)) {
            return;
        }

        this.pending.add(text);
        this.scheduleFlush();
    }

    private scheduleFlush(): void {
        if (this.flushTimer !== null) {
            return;
        }

        this.flushTimer = window.setTimeout(() => {
            this.flushTimer = null;
            void this.flush();
        }, FLUSH_DELAY);
    }

    private async flush(): Promise<void> {
        if (!this.started || this.target === this.source) {
            return;
        }

        const queued = Array.from(this.pending);
        this.pending.clear();

        const target = this.target;
        const generation = this.generation;
        const todo = queued.filter(
            (text) => !this.inflight.has(text) && !this.cache.has(this.key(text)),
        );

        if (todo.length === 0) {
            return;
        }

        for (const chunk of chunkTexts(todo)) {
            chunk.forEach((text) => this.inflight.add(text));

            try {
                const results = await translateBatch(chunk, target);

                if (generation !== this.generation) {
                    return;
                }

                for (const [text, translated] of results) {
                    this.cache.set(this.key(text), translated);

                    if (this.cache.size > CACHE_LIMIT) {
                        const oldest = this.cache.keys().next().value;

                        if (oldest !== undefined) {
                            this.cache.delete(oldest);
                        }
                    }
                }
            } finally {
                chunk.forEach((text) => this.inflight.delete(text));
            }
        }

        if (generation === this.generation) {
            this.apply();
        }
    }

    private apply(): void {
        if (this.target === this.source) {
            return;
        }

        for (const [node, original] of this.textOriginals) {
            if (!node.isConnected) {
                this.textOriginals.delete(node);
                continue;
            }

            const split = parts(original);

            if (!split) {
                continue;
            }

            const hit = this.cache.get(this.key(split.core));

            if (hit === undefined) {
                continue;
            }

            const value = split.lead + hit + split.trail;

            if (node.data !== value) {
                this.writeText(node, value);
            }
        }

        for (const [el, map] of this.attrOriginals) {
            if (!el.isConnected) {
                this.attrOriginals.delete(el);
                continue;
            }

            for (const [attr, original] of map) {
                const split = parts(original);

                if (!split) {
                    continue;
                }

                const hit = this.cache.get(this.key(split.core));

                if (hit === undefined) {
                    continue;
                }

                const value = split.lead + hit + split.trail;

                if ((el.getAttribute(attr) ?? '') !== value) {
                    this.writeAttr(el, attr, value);
                }
            }
        }
    }

    private restore(): void {
        for (const [node, original] of this.textOriginals) {
            if (node.isConnected) {
                this.writeText(node, original);
            }
        }

        this.textOriginals.clear();

        for (const [el, map] of this.attrOriginals) {
            if (!el.isConnected) {
                continue;
            }

            for (const [attr, original] of map) {
                this.writeAttr(el, attr, original);
            }
        }

        this.attrOriginals.clear();
        this.pending.clear();
    }

    private prune(): void {
        for (const node of this.textOriginals.keys()) {
            if (!node.isConnected) {
                this.textOriginals.delete(node);
            }
        }

        for (const el of this.attrOriginals.keys()) {
            if (!el.isConnected) {
                this.attrOriginals.delete(el);
            }
        }
    }

    private key(text: string): string {
        return `${this.target}\u0000${text}`;
    }

    private writeText(node: Text, value: string): void {
        this.recentNodes.add(node);
        node.data = value;
        this.scheduleRecentClear();
    }

    private writeAttr(el: Element, attr: AttrName, value: string): void {
        this.recentAttrs.add(el);
        el.setAttribute(attr, value);
        this.scheduleRecentClear();
    }

    private scheduleRecentClear(): void {
        if (this.clearTimer !== null) {
            return;
        }

        this.clearTimer = window.setTimeout(() => {
            this.clearTimer = null;
            this.recentNodes.clear();
            this.recentAttrs.clear();
        }, 0);
    }

    /** Source locale for the current configuration (diagnostics). */
    get sourceLanguage(): string {
        return this.config?.source || this.source || 'en';
    }

    get targetLanguage(): string {
        return this.target;
    }
}

export const autoTranslator = new AutoTranslator();
