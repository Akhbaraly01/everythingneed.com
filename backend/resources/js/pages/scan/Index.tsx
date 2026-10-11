import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Keyboard, ScanQrCode, XCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { api, errorMessage } from '@/lib/api';

interface CodeResult {
    type: string;
    id: string;
    title: string;
    description?: string;
    price?: number;
    url: string;
}

/**
 * Spec phase 20: product/barcode/QR scan workflow.
 * Camera QR decode (jsQR) plus manual code entry, both resolving through
 * the real search API - never a dead button.
 */
export default function ScanIndex() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanningRef = useRef(false);

    const [mode, setMode] = useState<'camera' | 'manual'>('camera');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<CodeResult[]>([]);
    const [searched, setSearched] = useState(false);

    const stopCamera = useCallback(() => {
        scanningRef.current = false;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => stopCamera, [stopCamera]);

    /** Route a decoded payload: internal link -> visit, otherwise code lookup. */
    const resolvePayload = useCallback(async (text: string) => {
        const value = text.trim();
        if (!value) return;

        try {
            // Internal deep links (same origin or root-relative) navigate directly.
            const url = new URL(value, window.location.origin);
            if (url.origin === window.location.origin) {
                stopCamera();
                router.visit(`${url.pathname}${url.search}`);
                return;
            }
        } catch {
            // Not a URL - fall through to code lookup.
        }

        setMode('manual');
        setCode(value);
        await lookup(value);
    }, [stopCamera]);

    const lookup = async (value: string) => {
        const q = value.trim();
        if (q.length < 2) {
            setError('Enter at least 2 characters to look up a code.');
            return;
        }
        setBusy(true);
        setError(null);
        setSearched(false);
        try {
            const payload = await api.get<{ data: CodeResult[] }>(
                `/api/search?q=${encodeURIComponent(q)}&type=products`,
            );
            const items = Array.isArray(payload.data) ? payload.data : [];
            setResults(items);
            setSearched(true);
            if (items.length === 1 && items[0].url) {
                router.visit(items[0].url);
            }
        } catch (e) {
            setError(errorMessage(e, 'Code lookup failed. Try again.'));
        } finally {
            setBusy(false);
        }
    };

    const startCamera = useCallback(async () => {
        setCameraError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError('This device or browser does not support camera access. Use manual entry instead.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            streamRef.current = stream;
            const video = videoRef.current;
            if (!video) return;
            video.srcObject = stream;
            await video.play();
            scanningRef.current = true;

            const tick = () => {
                if (!scanningRef.current) return;
                const canvas = canvasRef.current;
                if (video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (ctx) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const decoded = jsQR(frame.data, frame.width, frame.height);
                        if (decoded?.data) {
                            void resolvePayload(decoded.data);
                            return;
                        }
                    }
                }
                window.setTimeout(tick, 300);
            };
            tick();
        } catch {
            setCameraError('Camera access was denied or is unavailable. Use manual entry instead.');
        }
    }, [resolvePayload]);

    useEffect(() => {
        if (mode === 'camera') {
            void startCamera();
        } else {
            stopCamera();
        }
    }, [mode, startCamera, stopCamera]);

    return (
        <AppLayout title="Scan">
            <Head title="Scan" />
            <div className="mx-auto max-w-2xl px-3 py-6">
                <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <ScanQrCode className="h-6 w-6" /> Scan a product code
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Point your camera at a QR code or enter a product code to find it instantly.
                </p>

                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('camera')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                            mode === 'camera'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                    >
                        <Camera className="h-4 w-4" /> Camera
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('manual')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                            mode === 'manual'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                    >
                        <Keyboard className="h-4 w-4" /> Manual entry
                    </button>
                </div>

                {mode === 'camera' && (
                    <div className="mt-4 overflow-hidden rounded-xl bg-black">
                        {cameraError ? (
                            <p className="p-6 text-sm text-amber-200">{cameraError}</p>
                        ) : (
                            <>
                                <video ref={videoRef} className="h-72 w-full object-cover" playsInline muted />
                                <canvas ref={canvasRef} className="hidden" />
                            </>
                        )}
                    </div>
                )}

                {mode === 'manual' && (
                    <form
                        className="mt-4 flex gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void lookup(code);
                        }}
                    >
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter product code, SKU or name"
                            aria-label="Product code"
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {busy ? 'Searching...' : 'Find'}
                        </button>
                    </form>
                )}

                {error && (
                    <p className="mt-3 flex items-center gap-1 text-sm text-red-600">
                        <XCircle className="h-4 w-4" /> {error}
                    </p>
                )}

                {searched && (
                    <div className="mt-4">
                        {results.length === 0 ? (
                            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                No products matched that code. Check the code and try again.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {results.map((r) => (
                                    <li key={`${r.type}-${r.id}`}>
                                        <Link
                                            href={r.url}
                                            className="block rounded-lg border border-gray-200 p-3 hover:border-indigo-400 dark:border-gray-700"
                                        >
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {r.title}
                                            </span>
                                            {r.description && (
                                                <span className="block truncate text-sm text-gray-500">
                                                    {r.description}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
