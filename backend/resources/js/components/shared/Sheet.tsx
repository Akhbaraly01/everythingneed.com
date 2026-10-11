import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SheetVariant = 'modal' | 'bottom' | 'right' | 'left';

export interface SheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    /** Placement of the panel. Default `modal` (centered). */
    variant?: SheetVariant;
    /** Width/height cap for the panel. */
    className?: string;
    /** Hide the built-in close button (custom headers supply their own). */
    hideClose?: boolean;
    /** Disable clicking the backdrop to close (destructive flows). */
    dismissible?: boolean;
    /** Element to focus when the sheet opens. Defaults to the panel. */
    initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const PANEL: Record<SheetVariant, string> = {
    modal: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(32rem,calc(100vw-2rem))] max-h-[min(85vh,48rem)] rounded-2xl',
    bottom:
        'left-0 right-0 bottom-0 max-h-[min(85vh,48rem)] w-full rounded-t-3xl pb-[var(--safe-bottom)] ' +
        'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
    right: 'top-0 right-0 h-full w-[min(26rem,calc(100vw-3rem))] rounded-l-2xl data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
    left: 'top-0 left-0 h-full w-[min(26rem,calc(100vw-3rem))] rounded-r-2xl data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
};

const WRAPPER: Record<SheetVariant, string> = {
    modal: 'items-center justify-center p-4',
    bottom: 'items-end',
    right: 'items-stretch justify-end',
    left: 'items-stretch justify-start',
};

/**
 * One overlay surface for modal / bottom-sheet / slide-over. Locks body
 * scroll while open, restores it on close, closes on Escape, traps Tab
 * inside, and renders on the sheet z-band (`z-sheet`).
 */
export function Sheet({
    open,
    onClose,
    title,
    description,
    children,
    variant = 'modal',
    className,
    hideClose = false,
    dismissible = true,
    initialFocusRef,
}: SheetProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);

    // Body scroll lock + restore (spec: modals lock and restore position).
    useEffect(() => {
        if (!open) return;
        const { body } = document;
        const prevOverflow = body.style.overflow;
        const prevPadding = body.style.paddingRight;
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;
        body.style.overflow = 'hidden';
        if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
        return () => {
            body.style.overflow = prevOverflow;
            body.style.paddingRight = prevPadding;
        };
    }, [open]);

    // Escape to close + focus management.
    useEffect(() => {
        if (!open) return;
        previouslyFocused.current = document.activeElement as HTMLElement | null;
        const target = initialFocusRef?.current ?? panelRef.current;
        target?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && dismissible) {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
            );
            if (!focusables || focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
            previouslyFocused.current?.focus?.();
        };
    }, [open, onClose, dismissible, initialFocusRef]);

    if (!open) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-sheet flex animate-in fade-in-0 duration-base',
                WRAPPER[variant],
            )}
        >
            <div
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in-0"
                onClick={dismissible ? onClose : undefined}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                data-state="open"
                className={cn(
                    'glass-3 glass-edge relative flex max-h-full flex-col outline-none',
                    'shadow-xl',
                    PANEL[variant],
                    className,
                )}
            >
                {title || !hideClose ? (
                    <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
                        <div className="min-w-0">
                            {title ? (
                                <h2 className="truncate text-base font-semibold text-foreground">{title}</h2>
                            ) : null}
                            {description ? (
                                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                            ) : null}
                        </div>
                        {!hideClose ? (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="tap-safe -m-1 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        ) : null}
                    </div>
                ) : null}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Sheet;
