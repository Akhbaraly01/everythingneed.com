export type AutoTranslateEngine = 'proxy' | 'google' | 'off';

/** Shared Inertia prop `autoTranslate` (HandleInertiaRequests). */
export interface AutoTranslateConfig {
    engine: AutoTranslateEngine;
    source?: string | null;
}

export interface AutoTranslateResponse {
    translations?: string[];
}
