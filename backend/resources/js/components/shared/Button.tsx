import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'icon';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Renders a spinner and blocks clicks. */
    loading?: boolean;
    /** Decorative element rendered before the label. */
    iconLeft?: ReactNode;
    /** Decorative element rendered after the label. */
    iconRight?: ReactNode;
    /** Square icon-only button. The accessible name must come from aria-label. */
    iconOnly?: boolean;
    /** Full-width block button (forms on mobile). */
    fullWidth?: boolean;
    /** Fires a short vibration where the platform supports it. */
    haptic?: boolean;
    children?: ReactNode;
}

const BASE =
    'relative isolate inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium ' +
    'transition-[transform,box-shadow,background-color,color,opacity] duration-fast ease-out-spring ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
    'disabled:pointer-events-none disabled:opacity-55 ' +
    // 3D body: specular top highlight + bevel. `-z-10` keeps the overlay
    // above the button background but below the label.
    'before:pointer-events-none before:absolute before:inset-x-2.5 before:top-0 before:h-1/2 before:-z-10 before:rounded-t-lg ' +
    'before:bg-gradient-to-b before:from-white/28 before:via-white/8 before:to-transparent ' +
    'active:translate-y-px active:before:opacity-40';

const SIZES: Record<ButtonSize, string> = {
    // Visual heights stay compact; .tap-safe expands the hit area to 44px.
    sm: 'h-9 px-3 text-sm before:rounded-t-md',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
};

const ICON_SIZES: Record<ButtonSize, string> = {
    sm: 'h-9 w-9 p-0',
    md: 'h-10 w-10 p-0',
    lg: 'h-12 w-12 p-0',
};

const VARIANTS: Record<ButtonVariant, string> = {
    primary:
        'bg-gradient-to-b from-[hsl(var(--brand-blue))] to-[hsl(217_91%_52%)] text-white ' +
        'shadow-md shadow-[hsl(var(--brand-blue)/0.32)] hover:shadow-lg hover:shadow-glow-primary hover:-translate-y-0.5 ' +
        'active:shadow-sm active:translate-y-px',
    secondary:
        'bg-gradient-to-b from-[hsl(var(--brand-violet))] to-[hsl(280_87%_58%)] text-white ' +
        'shadow-md shadow-[hsl(var(--brand-violet)/0.32)] hover:shadow-lg hover:shadow-glow-secondary hover:-translate-y-0.5 ' +
        'active:shadow-sm active:translate-y-px',
    outline:
        'border border-border bg-card/80 text-foreground backdrop-blur-sm ' +
        'shadow-xs hover:border-primary/50 hover:bg-card hover:text-primary hover:shadow-md ' +
        'active:translate-y-px',
    ghost: 'bg-transparent text-foreground hover:bg-muted hover:text-foreground',
    danger:
        'bg-gradient-to-b from-[hsl(var(--destructive))] to-[hsl(0_84%_52%)] text-white ' +
        'shadow-md shadow-[hsl(var(--destructive)/0.3)] hover:shadow-lg hover:shadow-glow-danger hover:-translate-y-0.5 ' +
        'active:shadow-sm active:translate-y-px',
    success:
        'bg-gradient-to-b from-[hsl(var(--success))] to-[hsl(142_76%_30%)] text-white ' +
        'shadow-md shadow-[hsl(var(--success)/0.3)] hover:shadow-lg hover:shadow-glow-success hover:-translate-y-0.5 ' +
        'active:shadow-sm active:translate-y-px',
    icon: 'bg-card/85 text-foreground border border-border backdrop-blur-sm shadow-xs ' +
        'hover:border-primary/40 hover:text-primary hover:shadow-md active:translate-y-px',
};

function buzz(enabled: boolean | undefined): void {
    if (!enabled) return;
    try {
        navigator.vibrate?.(12);
    } catch {
        // Unsupported or blocked — nothing to do.
    }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        variant = 'primary',
        size = 'md',
        loading = false,
        iconLeft,
        iconRight,
        iconOnly = false,
        fullWidth = false,
        haptic = false,
        className,
        disabled,
        onClick,
        children,
        type = 'button',
        ...rest
    },
    ref,
) {
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        if (loading || disabled) {
            event.preventDefault();
            return;
        }
        buzz(haptic);
        onClick?.(event);
    };

    const sizeClass = iconOnly ? ICON_SIZES[size] : SIZES[size];

    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            onClick={handleClick}
            className={cn(
                BASE,
                sizeClass,
                VARIANTS[variant],
                'tap-safe',
                iconOnly && 'rounded-full before:rounded-full',
                fullWidth && 'w-full',
                className,
            )}
            {...rest}
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {/* Keep the label for the accessible name while loading. */}
                    {typeof children === 'string' ? (
                        <span className="sr-only">{children}</span>
                    ) : null}
                </>
            ) : (
                <>
                    {iconLeft ? (
                        <span className="inline-flex shrink-0" aria-hidden="true">
                            {iconLeft}
                        </span>
                    ) : null}
                    {children}
                    {iconRight ? (
                        <span className="inline-flex shrink-0" aria-hidden="true">
                            {iconRight}
                        </span>
                    ) : null}
                </>
            )}
        </button>
    );
});

/** Class helper so existing <Link className="..."> buttons can migrate. */
export const buttonClasses = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md') =>
    cn(BASE, SIZES[size], VARIANTS[variant], 'tap-safe');
