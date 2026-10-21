import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, ScanQrCode, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
    className?: string;
}

/**
 * Search by photo.
 *
 * Two ways in, both mobile-first:
 *   - "Take a photo" opens the device camera through getUserMedia and
 *     captures a frame from the live preview.
 *   - "Upload from device" opens the gallery / camera roll (the file
 *     input carries `capture` so phones offer the camera directly).
 *
 * The photo is posted to /api/search/image, where it is turned into a
 * marketplace query (AI vision when the deployment has an AI gateway,
 * otherwise the file name). The shopper lands on the regular search
 * results with that query.
 */
export default function PictureSearch({ className = '' }: Props) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'choose' | 'camera'>('choose');
    const [busy, setBusy] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const stopCamera = (): void => {
        stream?.getTracks().forEach((track) => track.stop());
        setStream(null);
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    useEffect(() => {
        if (mode === 'camera' && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            void videoRef.current.play().catch(() => null);
        }
    }, [mode, stream]);

    const close = (): void => {
        stopCamera();
        setMode('choose');
        setOpen(false);
    };

    const startCamera = async (): Promise<void> => {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            toast.error('This device has no camera - upload a picture instead.');
            fileRef.current?.click();

            return;
        }

        try {
            const media = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });

            setStream(media);
            setMode('camera');
        } catch {
            toast.error('Camera access was blocked - upload a picture instead.');
            fileRef.current?.click();
        }
    };

    const capture = async (): Promise<void> => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.9),
        );

        if (!blob) {
            toast.error('The photo could not be captured.');

            return;
        }

        await search(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
    };

    const search = async (file: File): Promise<void> => {
        setBusy(true);

        try {
            const form = new FormData();
            form.append('image', file);

            const res = await api.post<{ query: string }>('/api/search/image', form);
            const query = res.query?.trim() ?? '';

            if (query === '') {
                toast.error('We could not work out what to search for.');

                return;
            }

            close();
            router.visit(`/search?q=${encodeURIComponent(query)}&source=image`, {
                preserveState: false,
            });
        } catch (err) {
            toast.error(errorMessage(err, 'Picture search failed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Search by image"
                className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex ${className}`}
            >
                <Camera className="h-4 w-4" aria-hidden="true" />
            </button>

            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';

                    if (file) {
                        void search(file);
                    }
                }}
            />

            {open && (
                <div
                    className="fixed inset-0 z-modal flex items-end justify-center bg-black/50 p-4 sm:items-center"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Search by image"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            close();
                        }
                    }}
                >
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-xl">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <h2 className="text-sm font-semibold text-foreground">Search by photo</h2>
                            <button
                                type="button"
                                onClick={close}
                                aria-label="Close"
                                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {mode === 'camera' ? (
                            <div className="space-y-3 p-4">
                                <video
                                    ref={videoRef}
                                    playsInline
                                    muted
                                    className="aspect-[3/4] w-full rounded-xl bg-black object-cover"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void capture()}
                                        disabled={busy}
                                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
                                    >
                                        {busy ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Camera className="h-4 w-4" />
                                        )}
                                        Take photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            stopCamera();
                                            setMode('choose');
                                        }}
                                        className="h-11 rounded-xl border border-border px-4 text-sm text-foreground"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 p-4">
                                <button
                                    type="button"
                                    onClick={() => void startCamera()}
                                    disabled={busy}
                                    className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                                >
                                    <Camera className="h-5 w-5 shrink-0 text-primary" />
                                    <span className="flex-1">
                                        <span className="block font-medium">Take a photo</span>
                                        <span className="block text-xs text-muted-foreground">
                                            Use the camera of this device
                                        </span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={busy}
                                    className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                                >
                                    <ImagePlus className="h-5 w-5 shrink-0 text-primary" />
                                    <span className="flex-1">
                                        <span className="block font-medium">
                                            Upload from this device
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            Pick a picture from your gallery or files
                                        </span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        router.visit('/scan');
                                    }}
                                    disabled={busy}
                                    className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                                >
                                    <ScanQrCode className="h-5 w-5 shrink-0 text-primary" />
                                    <span className="flex-1">
                                        <span className="block font-medium">
                                            Scan a product code
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            Look up a QR or barcode instead
                                        </span>
                                    </span>
                                </button>
                                {busy && (
                                    <p className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Looking for matching products...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
