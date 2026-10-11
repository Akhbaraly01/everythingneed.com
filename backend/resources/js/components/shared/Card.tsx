import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Frosted glass surface (default) or a solid token surface. */
    surface?: 'glass' | 'solid';
    /** Elevation level: `flat` = border only, `raised` = resting shadow. */
    elevation?: 'flat' | 'raised' | 'floating';
    /** 1px refractive edge light (glass only). */
    edge?: boolean;
    interactive?: boolean;
}

const SURFACES = {
    glass: 'glass-1',
    solid: 'bg-card border border-border',
} as const;

const ELEVATIONS = {
    flat: '',
    raised: 'shadow-md',
    floating: 'shadow-lg',
} as const;

/** Shared card surface used by stats, quick actions, product tiles and panels. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
    { surface = 'solid', elevation = 'raised', edge = false, interactive = false, className, ...rest },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                'rounded-xl text-card-foreground',
                SURFACES[surface],
                ELEVATIONS[elevation],
                edge && surface === 'glass' && 'glass-edge',
                interactive &&
                    'transition-[transform,box-shadow,border-color] duration-fast ease-out-spring hover:-translate-y-0.5 hover:shadow-lg active:translate-y-px',
                className,
            )}
            {...rest}
        />
    );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    function CardHeader({ className, ...rest }, ref) {
        return <div ref={ref} className={cn('flex flex-col space-y-1 p-5', className)} {...rest} />;
    },
);

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
    function CardTitle({ className, ...rest }, ref) {
        return (
            <h3
                ref={ref}
                className={cn('text-base font-semibold leading-none tracking-tight text-foreground', className)}
                {...rest}
            />
        );
    },
);

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    function CardDescription({ className, ...rest }, ref) {
        return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...rest} />;
    },
);

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    function CardContent({ className, ...rest }, ref) {
        return <div ref={ref} className={cn('p-5 pt-0', className)} {...rest} />;
    },
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    function CardFooter({ className, ...rest }, ref) {
        return (
            <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...rest} />
        );
    },
);

export default Card;
