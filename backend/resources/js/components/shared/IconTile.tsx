import {
    isValidElement,
    useRef,
    type CSSProperties,
    type MouseEvent,
    type ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconTileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconTileProps {
    /** A lucide icon component, or any pre-rendered node. */
    icon?: LucideIcon | ReactNode;
    /** Tailwind gradient classes, e.g. `from-blue-500 to-indigo-600`. */
    gradient?: string;
    size?: IconTileSize;
    /** Grow with the viewport (used by category tiles). */
    responsive?: boolean;
    /** Gentle idle float (disabled automatically under reduced motion). */
    float?: boolean;
    /** Pointer-tracked tilt + glow on hover (fine pointers only). */
    tilt?: boolean;
    /** Accessible name. Without it the tile is decorative (aria-hidden). */
    label?: string;
    className?: string;
    style?: CSSProperties;
}

const SIZES: Record<IconTileSize, string> = {
    xs: 'h-9 w-9 rounded-xl',
    sm: 'h-11 w-11 rounded-xl',
    md: 'h-14 w-14 rounded-2xl',
    lg: 'h-[4.5rem] w-[4.5rem] rounded-3xl',
    xl: 'h-24 w-24 rounded-3xl',
};

const ICON_SIZES: Record<IconTileSize, string> = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-11 w-11',
};

/** Maps the responsive ramp to the spec breakpoints (400 / 768 / 1024 / 1536). */
const RESPONSIVE: Record<IconTileSize, string> = {
    xs: 'h-9 w-9 xs:h-10 xs:w-10 md:h-11 md:w-11',
    sm: 'h-11 w-11 md:h-12 md:w-12 lg:h-14 lg:w-14',
    md: 'h-14 w-14 md:h-16 md:w-16 lg:h-[4.5rem] lg:w-[4.5rem]',
    lg: 'h-16 w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20 xl:h-24 xl:w-24',
    xl: 'h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28',
};

const RESPONSIVE_ICON: Record<IconTileSize, string> = {
    xs: 'h-4 w-4 md:h-5 md:w-5',
    sm: 'h-5 w-5 md:h-6 md:w-6',
    md: 'h-6 w-6 md:h-7 md:w-7',
    lg: 'h-7 w-7 md:h-8 md:w-8 xl:h-10 xl:w-10',
    xl: 'h-9 w-9 md:h-11 md:w-11',
};

function finePointer(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    try {
        return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch {
        return false;
    }
}

/**
 * Shared 3D icon tile: gradient body, specular highlight, bevel, contact
 * shadow, press sink, optional desktop tilt and idle float. Used by category
 * tiles, dashboard quick actions and every menu icon — no raster images.
 */
export function IconTile({
    icon,
    gradient = 'from-[hsl(var(--brand-blue))] to-[hsl(217_91%_52%)]',
    size = 'md',
    responsive = false,
    float = false,
    tilt = false,
    label,
    className,
    style,
}: IconTileProps) {
    const ref = useRef<HTMLSpanElement>(null);

    const onPointerMove = (event: MouseEvent<HTMLSpanElement>) => {
        if (!tilt || !finePointer() || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        ref.current.style.transform = `perspective(480px) rotateX(${(-py * 14).toFixed(2)}deg) rotateY(${(px * 14).toFixed(2)}deg) translateY(-2px)`;
    };

    const onPointerLeave = () => {
        if (ref.current) ref.current.style.transform = '';
    };

    // lucide icons are forwardRef objects (typeof 'object'), plain function
    // components are 'function'. Anything already rendered (string/element)
    // is passed through below.
    const iconType = typeof icon;
    const Icon =
        !isValidElement(icon) && icon && (iconType === 'function' || iconType === 'object')
            ? (icon as LucideIcon)
            : null;

    return (
        <span
            ref={ref}
            role={label ? 'img' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            onMouseMove={tilt ? onPointerMove : undefined}
            onMouseLeave={tilt ? onPointerLeave : undefined}
            className={cn(
                'relative inline-flex shrink-0 items-center justify-center overflow-hidden text-white',
                'bg-gradient-to-br shadow-md',
                'before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-1/2',
                'before:bg-gradient-to-b before:from-white/35 before:via-white/10 before:to-transparent',
                'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit]',
                'after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),inset_0_-2px_4px_-2px_rgba(0,0,0,0.25)]',
                'transition-transform duration-fast ease-out-spring will-change-transform',
                'hover:shadow-lg active:translate-y-px active:scale-95',
                float && 'animate-tile-float',
                responsive ? RESPONSIVE[size] : SIZES[size],
                gradient,
                className,
            )}
            style={style}
        >
            {Icon ? (
                <Icon
                    className={cn(
                        'relative z-10 drop-shadow-sm',
                        responsive ? RESPONSIVE_ICON[size] : ICON_SIZES[size],
                    )}
                    aria-hidden="true"
                />
            ) : (
                <span className="relative z-10">{icon as ReactNode}</span>
            )}
        </span>
    );
}

export default IconTile;
