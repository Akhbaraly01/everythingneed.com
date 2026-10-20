import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/use-language';

/**
 * Accessible language menu.
 *
 * Keyboard: Enter/Space/ArrowDown open, ArrowUp/Down move, Home/End
 * jump, Escape closes and returns focus to the trigger. Selecting a
 * locale updates i18next + cookie + `/locale` via LanguageProvider,
 * which also drives AutoTranslateBridge.
 */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
    const { language, setLanguage, availableLocales, t } = useLanguage();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const items = (): HTMLButtonElement[] =>
        itemRefs.current.filter((item): item is HTMLButtonElement => item !== null);

    const focusItem = (index: number): void => {
        const all = items();

        if (all.length === 0) {
            return;
        }

        all[(index + all.length) % all.length]?.focus();
    };

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

        const selected = availableLocales.findIndex((locale) => locale.code === language);
        const frame = requestAnimationFrame(() => focusItem(selected < 0 ? 0 : selected));

        return () => cancelAnimationFrame(frame);
        // Focus runs once per open; locale changes while open are rare.
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

    const current = availableLocales.find((locale) => locale.code === language);

    return (
        <div ref={rootRef} className={`relative shrink-0 ${className}`}>
            <button
                ref={buttonRef}
                type="button"
                className="icon-glass-3d tap-safe cursor-pointer gap-0.5 px-1.5"
                aria-label={t('nav.language')}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
            >
                <Languages className="h-4 w-4" aria-hidden="true" />
                <span className="text-[9px] font-bold uppercase">
                    {current?.code ?? language}
                </span>
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label={t('nav.language')}
                    onKeyDown={onMenuKeyDown}
                    className="glass-3 glass-edge absolute right-0 top-full z-modal mt-1 max-h-80 w-40 overflow-y-auto rounded-xl p-1"
                >
                    {availableLocales.map((locale, index) => {
                        const active = locale.code === language;

                        return (
                            <button
                                key={locale.code}
                                ref={(element) => {
                                    itemRefs.current[index] = element;
                                }}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                onClick={() => {
                                    setLanguage(locale.code);
                                    setOpen(false);
                                    buttonRef.current?.focus();
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted ${
                                    active ? 'font-bold text-primary' : 'text-foreground'
                                }`}
                            >
                                {locale.flag && <span aria-hidden="true">{locale.flag}</span>}
                                <span>{locale.native}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
