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

// The candy body/rim/gloss/press anatomy lives in the .btn-3d recipe in
// app.css; here we only add sizing, focus and non-candy variants on top.
const BASE =
    'btn-3d tap-safe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const SIZES: Record<ButtonSize, string> = {
    // .btn-3d already enforces a 44px minimum via min-height.
    sm: 'min-h-9 px-3.5 text-sm',
    md: 'min-h-11 px-5 text-sm',
    lg: 'min-h-12 px-6 text-base',
};

const ICON_SIZES: Record<ButtonSize, string> = {
    sm: 'btn-icon-3d !w-9 !h-9 !min-h-9',
    md: 'btn-icon-3d',
    lg: 'btn-icon-3d !w-12 !h-12 !min-h-12',
};

// primary uses the recipe's default stops (blue). secondary recolors to
// violet via .btn-violet; outline/ghost are flat by design.
const VARIANTS: Record<ButtonVariant, string> = {
    primary: '',
    secondary: 'btn-violet',
    outline:
        'border border-border bg-card/80 text-foreground backdrop-blur-sm ' +
        'shadow-xs hover:border-primary/50 hover:bg-card hover:text-primary hover:shadow-md ' +
        'active:translate-y-px',
    ghost: 'bg-transparent text-foreground hover:bg-muted hover:text-foreground',
    danger: 'btn-danger',
    success: 'btn-success',
    icon: 'btn-glass btn-icon-3d text-foreground',
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

    // outline/ghost keep the .btn-3d min-height only; solid candy variants
    // get the full size ramp. icon variant already carries btn-icon-3d.
    const sizeClass = iconOnly
        ? ICON_SIZES[size]
        : variant === 'outline' || variant === 'ghost'
          ? SIZES[size]
          : SIZES[size];

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
                // outline/ghost must not paint the candy body.
                (variant === 'outline' || variant === 'ghost') && '!bg-none',
                loading && 'is-loading',
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
    cn(
        BASE,
        SIZES[size],
        VARIANTS[variant],
        (variant === 'outline' || variant === 'ghost') && '!bg-none',
    );
