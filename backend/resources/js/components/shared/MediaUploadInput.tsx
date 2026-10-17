import { useRef, useState } from 'react';
import { Link2, Loader2, Pencil, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { prepareForUpload } from '@/lib/media-compress';

interface MediaUploadInputProps {
    value: string;
    onChange: (url: string) => void;
    kind: 'image' | 'video';
    folder?: string;
    label: string;
    hint?: string;
    /** Testid applied to the paste-a-link input (e2e compatibility). */
    linkTestId?: string;
    /** Testid applied to the hidden file input. */
    uploadTestId?: string;
}

interface UploadedFile {
    url: string;
    path?: string;
    name?: string;
    mime_type?: string;
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|mkv)(\?|$)/i;

/**
 * Single image/video asset field with two paths: direct browser upload
 * (auto-compressed like WhatsApp — images downscale, videos transcode via
 * ffmpeg.wasm) or pasting an external link (YouTube/Vimeo/MP4). Returns one
 * URL either way, matching the product `image_url`/`video_url` contract.
 */
export default function MediaUploadInput({
    value,
    onChange,
    kind,
    folder = 'media',
    label,
    hint,
    linkTestId,
    uploadTestId,
}: MediaUploadInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);
    const [stage, setStage] = useState<'compressing' | 'uploading' | null>(null);
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkDraft, setLinkDraft] = useState(value);

    const pickFile = async (file: File | undefined) => {
        if (!file) return;
        setBusy(true);
        try {
            setStage('compressing');
            setProgress(null);
            const prepared = await prepareForUpload(file, { onProgress: setProgress });
            setStage('uploading');

            const form = new FormData();
            form.append('file', prepared.file);
            form.append('folder', folder);
            const res = await api.post<{ data: UploadedFile }>('/api/upload', form);
            if (res?.data?.url) {
                onChange(res.data.url);
                toast.success(prepared.compressed ? `Uploaded · ${prepared.note}` : 'Uploaded');
                setLinkDraft(res.data.url);
            }
        } catch (e) {
            toast.error(errorMessage(e, 'Upload failed. Images up to 25MB, videos up to 500MB.'));
        } finally {
            setBusy(false);
            setProgress(null);
            setStage(null);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const applyLink = () => {
        const url = linkDraft.trim();
        onChange(url);
        setLinkOpen(false);
        setLinkDraft(url);
    };

    const clear = () => {
        onChange('');
        setLinkDraft('');
    };

    const busyLabel = stage === 'compressing'
        ? (progress !== null ? `Compressing ${Math.round(progress * 100)}%…` : 'Compressing…')
        : 'Uploading…';

    const accept = kind === 'image'
        ? 'image/jpeg,image/png,image/webp,image/gif'
        : 'video/mp4,video/webm,video/quicktime,video/x-m4v';

    const isExternalVideo = kind === 'video' && value !== '' && !VIDEO_EXTENSIONS.test(value);
    const isLocalVideo = kind === 'video' && value !== '' && VIDEO_EXTENSIONS.test(value);

    return (
        <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>

            {value ? (
                <div className="flex items-start gap-3">
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-muted">
                        {kind === 'image' ? (
                            <img src={value} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : isLocalVideo ? (
                            <video src={value} className="h-full w-full object-cover" preload="metadata" muted />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center">
                                <Link2 className="h-4 w-4 text-gray-400" />
                                <span className="text-[10px] leading-tight text-gray-500 break-all">{isExternalVideo ? 'External video link' : value}</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={clear}
                            aria-label={`Remove ${kind}`}
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={busy}
                            data-testid={uploadTestId ? `${uploadTestId}-replace` : undefined}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                        >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                            {busy ? busyLabel : 'Replace'}
                        </button>
                        <button
                            type="button"
                            data-testid={uploadTestId ? `${uploadTestId}-link-toggle` : undefined}
                            onClick={() => { setLinkDraft(value); setLinkOpen((v) => !v); }}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-primary"
                        >
                            <Link2 className="h-3.5 w-3.5" /> Use a link instead
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        data-testid={uploadTestId}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {busy ? busyLabel : `Upload ${kind}`}
                    </button>
                    <button
                        type="button"
                        data-testid={uploadTestId ? `${uploadTestId}-link-toggle` : undefined}
                        onClick={() => setLinkOpen((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 hover:text-primary"
                    >
                        <Link2 className="h-4 w-4" /> Paste a link
                    </button>
                </div>
            )}

            {linkOpen && (
                <div className="flex items-center gap-2">
                    <input
                        type="url"
                        data-testid={linkTestId}
                        value={linkDraft}
                        onChange={(e) => setLinkDraft(e.target.value)}
                        placeholder={kind === 'video' ? 'https://www.youtube.com/watch?v=… or https://…/clip.mp4' : 'https://…/photo.jpg'}
                        className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                    />
                    <button
                        type="button"
                        onClick={applyLink}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                    >
                        Use link
                    </button>
                </div>
            )}

            {hint && <span className="block text-[11px] text-gray-400">{hint}</span>}

            <input
                ref={inputRef}
                data-testid={uploadTestId ? `${uploadTestId}-input` : undefined}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => void pickFile(e.target.files?.[0])}
            />
        </div>
    );
}
