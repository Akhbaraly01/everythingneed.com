import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Check, Globe, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/use-language';
import { useCurrency } from '@/lib/currency-context';
import { DISPLAY_CURRENCIES, type DisplayCurrency } from '@/lib/currency';

/**
 * Combined language + currency switcher (Alibaba style).
 *
 * The trigger shows the active combination ("English-USD"); the popover
 * carries two radio groups - language and currency - so a shopper can set
 * both in one visit.
 *
 * Language selection runs through LanguageProvider, which updates the
 * dictionary, the cookie and `/locale`, and drives AutoTranslateBridge:
 * the whole page (menus, CMS banners, categories, product titles) is
 * converted to the picked language, not only the curated UI strings.
 * While that runs the trigger shows a spinner (the bridge broadcasts
 * `everythingneed:translate-state`).
 *
 * Currency selection runs through CurrencyProvider, which converts and
 * re-formats every price and persists the choice (localStorage + account
 * preference).
 *
 * Accessibility: the trigger is a menu button; the popover is a menu
 * with two radio groups. Arrow keys move, Home/End jump, Escape closes
 * and returns focus to the trigger.
 */

interface CurrencyOption {
    code: DisplayCurrency;
    name: string;
    symbol: string;
}

function currencyOptions(): CurrencyOption[] {
    return DISPLAY_CURRENCIES.map((code) => {
        let name: string = code;
        let symbol: string = code;

        try {
            name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) ?? code;
            symbol = new Intl.NumberFormat('en', {
                style: 'currency',
                currency: code,
                currencyDisplay: 'narrowSymbol',
            })
                .formatToParts(0)
                .find((part) => part.type === 'currency')?.value ?? code;
        } catch {
            // Intl without currency data: fall back to the code.
        }

        return { code, name, symbol };
    });
}

export default function LocaleCurrencySwitcher({ className = '' }: { className?: string }) {
    const { language, setLanguage, availableLocales, t } = useLanguage();
    const { currency, setCurrency } = useCurrency();
    const [open, setOpen] = useState(false);
    const [translating, setTranslating] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const currencies = useMemo(() => currencyOptions(), []);
    const currentLocale = availableLocales.find((locale) => locale.code === language);

    const items = (): HTMLButtonElement[] =>
        itemRefs.current.filter((item): item is HTMLButtonElement => item !== null);

    const focusItem = (index: number): void => {
        const all = items();

        if (all.length === 0) {
            return;
        }

        all[(index + all.length) % all.length]?.focus();
    };

    // The whole-page translation runs in the background; the bridge tells
    // us when it starts and when it settled.
    useEffect(() => {
        const onState = (event: Event): void => {
            setTranslating(Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active));
        };

        window.addEventListener('everythingneed:translate-state', onState);

        return () => window.removeEventListener('everythingneed:translate-state', onState);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent): void => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const frame = requestAnimationFrame(() => focusItem(0));

        return () => cancelAnimationFrame(frame);
        // Focus runs once per open; the item list is rebuilt on open.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
        const all = items();
        const current = all.indexOf(document.activeElement as HTMLButtonElement);

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusItem(current + 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            focusItem(current - 1);
        } else if (event.key === 'Home') {
            event.preventDefault();
            focusItem(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            focusItem(all.length - 1);
        }
    };

    const close = (): void => {
        setOpen(false);
        buttonRef.current?.focus();
    };

    const label = `${currentLocale?.name ?? language}-${currency}`;

    let index = 0;

    return (
        <div ref={rootRef} className={`relative shrink-0 ${className}`}>
            <button
                ref={buttonRef}
                type="button"
                className="icon-glass-3d tap-safe flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold leading-none"
                aria-label={t('nav.languageAndCurrency', { defaultValue: 'Language and currency' })}
                aria-haspopup="menu"
                aria-expanded={open}
                data-auto-translate="off"
                onClick={() => setOpen((value) => !value)}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
            >
                <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="max-w-[7.5rem] truncate whitespace-nowrap">{label}</span>
                {translating ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" aria-hidden="true" />
                ) : (
                    <span className="sr-only">{t('nav.languageAndCurrency', { defaultValue: 'Language and currency' })}</span>
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label={t('nav.languageAndCurrency', { defaultValue: 'Language and currency' })}
                    onKeyDown={onMenuKeyDown}
                    className="glass-3 glass-edge absolute right-0 top-full z-modal mt-1 max-h-[min(28rem,70vh)] w-[19rem] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-xl p-1.5"
                >
                    <p className="px-2 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {t('nav.language', { defaultValue: 'Language' })}
                    </p>

                    {availableLocales.map((locale) => {
                        const active = locale.code === language;
                        const itemIndex = index++;

                        return (
                            <button
                                key={locale.code}
                                ref={(element) => {
                                    itemRefs.current[itemIndex] = element;
                                }}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                onClick={() => {
                                    setLanguage(locale.code);
                                    close();
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted ${
                                    active ? 'font-semibold text-primary' : 'text-foreground'
                                }`}
                            >
                                {locale.flag && <span aria-hidden="true">{locale.flag}</span>}
                                <span className="flex-1 truncate">{locale.native}</span>
                                <span className="text-[10px] uppercase text-muted-foreground">{locale.code}</span>
                                {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                            </button>
                        );
                    })}

                    <p className="mt-1.5 border-t border-border/60 px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {t('nav.currency', { defaultValue: 'Currency' })}
                    </p>

                    {currencies.map((option) => {
                        const active = option.code === currency;
                        const itemIndex = index++;

                        return (
                            <button
                                key={option.code}
                                ref={(element) => {
                                    itemRefs.current[itemIndex] = element;
                                }}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                onClick={() => {
                                    setCurrency(option.code);
                                    close();
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted ${
                                    active ? 'font-semibold text-primary' : 'text-foreground'
                                }`}
                            >
                                <span className="w-6 shrink-0 font-bold" aria-hidden="true">
                                    {option.symbol}
                                </span>
                                <span className="flex-1 truncate">{option.name}</span>
                                <span className="text-[10px] uppercase text-muted-foreground">{option.code}</span>
                                {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
