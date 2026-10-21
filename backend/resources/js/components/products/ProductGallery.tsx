import { useEffect, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Image from '@/components/shared/Image';

interface Props {
    name: string;
    images: string[];
    videoUrl?: string | null;
}

/**
 * Product gallery (Alibaba pattern): a vertical thumbnail rail next to a
 * large main image with hover magnification, plus a video thumbnail when
 * the vendor uploaded a product video.
 *
 * On phones the main frame is swipeable (left/right) and carries the
 * arrows and dots, so a photo set can be walked through without the
 * thumbnail rail.
 */
export default function ProductGallery({ name, images, videoUrl }: Props) {
    const all = images.filter(Boolean);
    const [active, setActive] = useState(0);
    const [zoom, setZoom] = useState(false);
    const [origin, setOrigin] = useState({ x: 50, y: 50 });
    const frameRef = useRef<HTMLDivElement>(null);
    const touchStart = useRef<number | null>(null);

    useEffect(() => {
        setActive(0);
    }, [images.length]);

    const current = all[active] ?? all[0] ?? null;

    const go = (delta: number): void => {
        if (all.length === 0) {
            return;
        }

        setActive((value) => (value + delta + all.length) % all.length);
    };

    const onMove = (event: React.MouseEvent<HTMLDivElement>): void => {
        const rect = frameRef.current?.getBoundingClientRect();

        if (!rect) {
            return;
        }

        setOrigin({
            x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
            y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
        });
    };

    return (
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {/* Thumbnail rail */}
            {all.length > 1 && (
                <ul className="flex shrink-0 gap-2 overflow-x-auto sm:w-16 sm:flex-col sm:overflow-visible">
                    {all.map((src, index) => (
                        <li key={`${src}-${index}`}>
                            <button
                                type="button"
                                onClick={() => setActive(index)}
                                aria-label={`${name} image ${index + 1}`}
                                aria-current={index === active}
                                className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-muted transition-colors ${
                                    index === active
                                        ? 'border-primary'
                                        : 'border-transparent hover:border-border'
                                }`}
                            >
                                <Image src={src} alt="" className="h-full w-full object-cover" />
                            </button>
                        </li>
                    ))}
                    {videoUrl && (
                        <li>
                            <span
                                className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-transparent bg-muted text-muted-foreground"
                                aria-hidden="true"
                            >
                                <Play className="h-5 w-5" />
                            </span>
                        </li>
                    )}
                </ul>
            )}

            {/* Main frame */}
            <div
                ref={frameRef}
                onMouseEnter={() => setZoom(true)}
                onMouseLeave={() => setZoom(false)}
                onMouseMove={onMove}
                onTouchStart={(event) => {
                    touchStart.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                    const start = touchStart.current;
                    const end = event.changedTouches[0]?.clientX ?? null;
                    touchStart.current = null;

                    if (start === null || end === null) {
                        return;
                    }

                    const delta = end - start;

                    if (Math.abs(delta) > 40) {
                        go(delta < 0 ? 1 : -1);
                    }
                }}
                className="relative aspect-square w-full select-none overflow-hidden rounded-xl border border-border bg-muted"
            >
                {current ? (
                    <Image
                        src={current}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-200"
                        style={
                            zoom
                                ? {
                                      transform: 'scale(1.8)',
                                      transformOrigin: `${origin.x}% ${origin.y}%`,
                                  }
                                : undefined
                        }
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Camera className="h-8 w-8" />
                        <span className="text-sm">No image</span>
                    </div>
                )}

                {videoUrl && (
                    <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white">
                        <Play className="h-3 w-3" /> Video
                    </span>
                )}

                {all.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={() => go(-1)}
                            aria-label="Previous image"
                            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow transition-opacity hover:opacity-100 sm:hidden"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => go(1)}
                            aria-label="Next image"
                            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow transition-opacity hover:opacity-100 sm:hidden"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 sm:hidden">
                            {all.map((src, index) => (
                                <span
                                    key={`dot-${src}-${index}`}
                                    className={`h-1.5 rounded-full transition-all ${
                                        index === active ? 'w-4 bg-primary' : 'w-1.5 bg-white/80'
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
