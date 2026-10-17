import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';

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

const isVideoUrl = (url: string): boolean => /\.(mp4|webm)(\?|$)/i.test(url);

/**
 * Optional evidence picker (aid injuries, booking prescriptions, product
 * media): files go through POST /api/upload (auth + GD pipeline +
 * own-scope) and only the returned URLs are submitted with the form —
 * raw client paths are never accepted server-side.
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
            for (const file of picked) {
                const form = new FormData();
                form.append('file', file);
                form.append('folder', folder);
                const res = await api.post<{ data: UploadedFile }>('/api/upload', form);
                if (res?.data?.url) urls.push(res.data.url);
            }
            if (urls.length > 0) {
                onChange([...value, ...urls]);
                toast.success(urls.length > 1 ? `${urls.length} files attached` : 'File attached');
            }
        } catch (e) {
            toast.error(errorMessage(e, 'Upload failed (images/video up to 10MB)'));
        } finally {
            setUploading((n) => Math.max(0, n - picked.length));
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const removeAt = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

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
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading > 0 || value.length >= max}
                    className="tap-safe inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                >
                    {uploading > 0 ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ImagePlus className="h-4 w-4" />
                    )}
                    {uploading > 0 ? `Uploading ${uploading}…` : value.length === 0 ? 'Add photos/video' : 'Add more'}
                </button>
                <span className="text-[11px] text-gray-400">
                    {hint ?? `Up to ${max} files, 10MB each. JPG, PNG, GIF, MP4, WebM, PDF.`}
                </span>
            </div>
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,.pdf"
                className="hidden"
                onChange={(e) => void uploadFiles(e.target.files)}
            />
        </div>
    );
}
