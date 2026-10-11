import { useEffect, useState, type ImgHTMLAttributes, type ReactEventHandler, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string | null;
    /** Shown when src is empty or fails to load. Defaults to the local placeholder. */
    fallbackSrc?: string;
    /**
     * Optional rich fallback (gradient tile + icon). Rendered instead of the
     * placeholder when the source is empty or fails. Additive — existing
     * callers are unaffected.
     */
    fallbackNode?: ReactNode;
}

/**
 * Image with a guaranteed fallback (W1): empty or dead URLs render the
 * local placeholder (or `fallbackNode`) instead of a broken-image icon /
 * raw alt text (defect D2). Lazy-loads by default and recovers when the
 * src changes (carousels, paginated re-keys).
 */
export default function Image({
    src,
    fallbackSrc = '/placeholder.svg',
    fallbackNode,
    alt = '',
    onError,
    onLoad,
    className,
    ...rest
}: ImageProps) {
    const [failed, setFailed] = useState(false);

    // A new source is a fresh chance (previously `failed` latched forever).
    useEffect(() => {
        setFailed(false);
    }, [src]);

    const handleError: ReactEventHandler<HTMLImageElement> = (e) => {
        setFailed(true);
        onError?.(e);
    };

    if (!src || failed) {
        if (fallbackNode) {
            return (
                <span className={cn('inline-flex', className)} role="img" aria-label={alt || undefined}>
                    {fallbackNode}
                </span>
            );
        }
        return <img src={fallbackSrc} alt={alt} loading="lazy" className={className} {...rest} />;
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={handleError}
            onLoad={onLoad}
            className={className}
            {...rest}
        />
    );
}
