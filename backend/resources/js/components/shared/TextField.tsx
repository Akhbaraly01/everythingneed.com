import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextFieldProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
    label?: string;
    /** Error message; also sets aria-invalid and the destructive ring. */
    error?: string | null;
    hint?: string;
    /** Decorative adornment rendered inside the field (icon, currency…). */
    prefix?: ReactNode;
    suffix?: ReactNode;
    /** Visual density. `lg` is the default for auth-style forms. */
    inputSize?: 'sm' | 'md' | 'lg';
    containerClassName?: string;
}

const FIELD =
    'peer w-full rounded-lg border bg-background/80 text-foreground placeholder:text-muted-foreground ' +
    'transition-[border-color,box-shadow,background-color] duration-fast ' +
    'focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/35 ' +
    'disabled:cursor-not-allowed disabled:opacity-60';

const FIELD_SIZES = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base',
} as const;

/**
 * Themed text field: distinct fill from the card in both themes (no more
 * white-on-white), token-driven border/ring, accessible label + error wiring.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
    { label, error, hint, prefix, suffix, inputSize = 'md', className, containerClassName, id, ...rest },
    ref,
) {
    const autoId = `tf-${(label ?? 'field').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const fieldId = id ?? autoId;
    const describedBy = [hint ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null]
        .filter(Boolean)
        .join(' ');

    const field = (
        <div className="relative flex items-center">
            {prefix ? (
                <span className="pointer-events-none absolute left-3 inline-flex text-muted-foreground" aria-hidden="true">
                    {prefix}
                </span>
            ) : null}
            <input
                ref={ref}
                id={fieldId}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy || undefined}
                className={cn(
                    FIELD,
                    FIELD_SIZES[inputSize],
                    prefix && 'pl-10',
                    suffix && 'pr-10',
                    error
                        ? 'border-destructive focus:border-destructive focus:ring-destructive/35'
                        : 'border-input',
                    className,
                )}
                {...rest}
            />
            {suffix ? (
                <span className="absolute right-3 inline-flex text-muted-foreground" aria-hidden="true">
                    {suffix}
                </span>
            ) : null}
        </div>
    );

    return (
        <div className={cn('w-full space-y-1.5', containerClassName)}>
            {label ? (
                <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
                    {label}
                </label>
            ) : null}
            {field}
            {hint && !error ? (
                <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
                    {hint}
                </p>
            ) : null}
            {error ? (
                <p id={`${fieldId}-error`} role="alert" className="text-xs font-medium text-destructive">
                    {error}
                </p>
            ) : null}
        </div>
    );
});

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string | null;
    hint?: string;
    containerClassName?: string;
}

/** Textarea companion with the same themed field treatment. */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
    { label, error, hint, className, containerClassName, id, rows = 4, ...rest },
    ref,
) {
    const autoId = `ta-${(label ?? 'field').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const fieldId = id ?? autoId;
    const describedBy = [hint ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={cn('w-full space-y-1.5', containerClassName)}>
            {label ? (
                <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
                    {label}
                </label>
            ) : null}
            <textarea
                ref={ref}
                id={fieldId}
                rows={rows}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy || undefined}
                className={cn(
                    FIELD,
                    'min-h-24 px-3 py-2 text-sm',
                    error
                        ? 'border-destructive focus:border-destructive focus:ring-destructive/35'
                        : 'border-input',
                    className,
                )}
                {...rest}
            />
            {hint && !error ? (
                <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
                    {hint}
                </p>
            ) : null}
            {error ? (
                <p id={`${fieldId}-error`} role="alert" className="text-xs font-medium text-destructive">
                    {error}
                </p>
            ) : null}
        </div>
    );
});

export default TextField;
