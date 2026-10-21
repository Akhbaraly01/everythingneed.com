import { useEffect, useRef, useState } from 'react';
import { Camera, Play } from 'lucide-react';
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
 */
export default function ProductGallery({ name, images, videoUrl }: Props) {
    const all = images.filter(Boolean);
    const [active, setActive] = useState(0);
    const [zoom, setZoom] = useState(false);
    const [origin, setOrigin] = useState({ x: 50, y: 50 });
    const frameRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setActive(0);
    }, [images.length]);

    const current = all[active] ?? all[0] ?? null;

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
                className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted"
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
            </div>
        </div>
    );
}
