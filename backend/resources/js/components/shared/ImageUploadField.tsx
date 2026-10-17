import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { formatBytes, prepareForUpload } from '@/lib/media-compress';

interface ImageUploadFieldProps {
    /** Uploader-produced URLs (POST /api/upload). Parent submits these. */
    value: string[];
    onChange: (urls: string[]) => void;
    /** Upload scope subfolder (letters/numbers/_/- only, enforced server-side). */
    folder?: string;
    max?: number;
    label?: string;
    hint?: string;
}

interface UploadedFile {
    url: string;
    path?: string;
    name?: string;
    mime_type?: string;
}

const isVideoUrl = (url: string): boolean => /\.(mp4|webm|mov|m4v|mkv)(\?|$)/i.test(url);

/**
 * Optional media picker (aid injuries, booking prescriptions, product media).
 * Files are compressed in the browser first (images downscale + re-encode,
 * videos transcode via ffmpeg.wasm), then go through POST /api/upload
 * (auth + GD pipeline + own-scope) and only the returned URLs are submitted
 * with the form — raw client paths are never accepted server-side.
 */
export default function ImageUploadField({
    value,
    onChange,
    folder = 'evidence',
    max = 5,
    label = 'Photos or videos (optional)',
    hint,
}: ImageUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(0);
    const [progress, setProgress] = useState<number | null>(null);
    const [stage, setStage] = useState<'idle' | 'compressing' | 'uploading'>('idle');

    const uploadFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const room = max - value.length;
        if (room <= 0) {
            toast.error(`At most ${max} files`);
            return;
        }
        const picked = Array.from(files).slice(0, room);
        setUploading((n) => n + picked.length);
        try {
            const urls: string[] = [];
            let saved = 0;
            for (const raw of picked) {
                setStage('compressing');
                setProgress(null);
                const prepared = await prepareForUpload(raw, { onProgress: (r) => setProgress(r) });
                setStage('uploading');

                const form = new FormData();
                form.append('file', prepared.file);
                form.append('folder', folder);
                const res = await api.post<{ data: UploadedFile }>('/api/upload', form);
                if (res?.data?.url) {
                    urls.push(res.data.url);
                    if (prepared.compressed) saved += prepared.originalSize - prepared.finalSize;
                }
            }
            if (urls.length > 0) {
                onChange([...value, ...urls]);
                toast.success(
                    saved > 0
                        ? `${urls.length > 1 ? `${urls.length} files attached` : 'File attached'} · saved ${formatBytes(saved)}`
                        : urls.length > 1 ? `${urls.length} files attached` : 'File attached',
                );
            }
        } catch (e) {
            toast.error(errorMessage(e, 'Upload failed. Photos up to 25MB, videos up to 500MB before auto-compression.'));
        } finally {
            setUploading((n) => Math.max(0, n - picked.length));
            setProgress(null);
            setStage('idle');
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const removeAt = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const busyLabel = (() => {
        if (uploading === 0) return null;
        if (stage === 'compressing' && progress !== null) return `Compressing ${Math.round(progress * 100)}%…`;
        if (stage === 'compressing') return 'Compressing…';
        return uploading > 1 ? `Uploading ${uploading}…` : 'Uploading…';
    })();

    return (
        <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((url, i) => (
                        <div key={`${url}-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted">
                            {isVideoUrl(url) ? (
                                <video src={url} className="h-full w-full object-cover" preload="metadata" />
                            ) : (
                                <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                            )}
                            <button
                                type="button"
                                onClick={() => removeAt(i)}
                                aria-label={`Remove attachment ${i + 1}`}
                                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    data-testid="image-upload-button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading > 0 || value.length >= max}
                    className="tap-safe inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                >
                    {uploading > 0 ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ImagePlus className="h-4 w-4" />
                    )}
                    {busyLabel ?? (value.length === 0 ? 'Add photos/video' : 'Add more')}
                </button>
                <span className="text-[11px] text-gray-400">
                    {hint ?? `Up to ${max} files. Auto-compressed before upload — no manual resizing needed.`}
                </span>
            </div>
            <input
                ref={inputRef}
                data-testid="image-upload-input"
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,video/quicktime,.pdf"
                className="hidden"
                onChange={(e) => void uploadFiles(e.target.files)}
            />
        </div>
    );
}
