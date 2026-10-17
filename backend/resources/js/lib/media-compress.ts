/**
 * WhatsApp-style automatic media compression that runs in the browser before
 * any upload leaves the device:
 *
 * - Images: decoded (EXIF orientation aware), downscaled to fit 1920px and
 *   re-encoded (WebP when the browser can, JPEG otherwise). A 4-12MP phone
 *   photo (~3-8MB) lands around 150-600KB with high visual quality.
 * - Videos: lazily boot a single-threaded ffmpeg.wasm (served same-origin
 *   from /build/ffmpeg) and transcode to H.264 MP4 capped at 720p height,
 *   CRF 28, AAC 128k. A 1-2GB camera clip typically lands at 20-60MB.
 *   Small files (<= 12MB) skip transcoding, mirroring WhatsApp.
 *
 * Everything degrades gracefully: if a pipeline fails or the runtime is
 * unavailable, the original file is returned so flows keep working.
 */

export type MediaKind = 'image' | 'video' | 'raw';

export interface PreparedMedia {
    file: File;
    kind: MediaKind;
    originalSize: number;
    finalSize: number;
    compressed: boolean;
    note?: string;
}

const IMAGE_SKIP_BYTES = 200 * 1024;
const IMAGE_MAX_DIMENSION = 1920;
const IMAGE_QUALITY = 0.85;
const VIDEO_SKIP_BYTES = 12 * 1024 * 1024;
const VIDEO_MAX_HEIGHT = 720;
const VIDEO_CRF = '28';
const FFMPEG_BASE = '/build/ffmpeg';

const PASSTHROUGH_IMAGE_TYPES = new Set(['image/gif', 'image/svg+xml']);

export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function mediaKindFor(mime: string): MediaKind {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    return 'raw';
}

export function shouldSkipImageCompression(size: number, width?: number, height?: number): boolean {
    if (size <= IMAGE_SKIP_BYTES) return true;
    if (width !== undefined && height !== undefined && Math.max(width, height) <= IMAGE_MAX_DIMENSION && size <= 800 * 1024) {
        return true;
    }
    return false;
}

export function shouldSkipVideoCompression(size: number): boolean {
    return size <= VIDEO_SKIP_BYTES;
}

export function mediaKindOf(file: File): MediaKind {
    if (PASSTHROUGH_IMAGE_TYPES.has(file.type)) return 'raw';
    return mediaKindFor(file.type);
}

function replaceExtension(name: string, extension: string): string {
    const base = name.replace(/\.[^./\\]+$/, '');
    return `${base || 'file'}.${extension}`;
}

async function decodeImage(file: File): Promise<{ drawable: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
    if ('createImageBitmap' in window) {
        try {
            const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
            return { drawable: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
        } catch {
            // fall through to the <img> path
        }
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('image-decode-failed'));
        image.src = url;
    });
    return {
        drawable: image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        cleanup: () => URL.revokeObjectURL(url),
    };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));
}

export async function compressImage(file: File): Promise<File> {
    const { drawable, width, height, cleanup } = await decodeImage(file);

    try {
        if (shouldSkipImageCompression(file.size, width, height)) {
            return file;
        }

        const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext('2d');
        if (!context) return file;

        const needsAlpha = file.type === 'image/png' || file.type === 'image/webp';
        if (!needsAlpha) {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, targetWidth, targetHeight);
        }
        context.drawImage(drawable, 0, 0, targetWidth, targetHeight);

        const webpCandidate = needsAlpha || file.size > 400 * 1024;
        const attempts: Array<{ type: string; extension: string; quality: number }> = webpCandidate
            ? [
                { type: 'image/webp', extension: 'webp', quality: IMAGE_QUALITY },
                { type: 'image/jpeg', extension: 'jpg', quality: IMAGE_QUALITY },
            ]
            : [{ type: 'image/jpeg', extension: 'jpg', quality: IMAGE_QUALITY }];

        let best: { blob: Blob; type: string; extension: string } | null = null;
        for (const attempt of attempts) {
            const blob = await canvasToBlob(canvas, attempt.type, attempt.quality);
            if (!blob) continue;
            if (best === null || blob.size < best.blob.size) {
                best = { blob, type: attempt.type, extension: attempt.extension };
            }
        }

        if (!best || best.blob.size >= file.size) {
            return file;
        }

        return new File([best.blob], replaceExtension(file.name, best.extension), {
            type: best.type,
            lastModified: Date.now(),
        });
    } finally {
        cleanup();
    }
}

let ffmpegPromise: Promise<import('@ffmpeg/ffmpeg').FFmpeg> | null = null;

async function loadFFmpeg(): Promise<import('@ffmpeg/ffmpeg').FFmpeg> {
    if (!ffmpegPromise) {
        ffmpegPromise = (async () => {
            const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
                import('@ffmpeg/ffmpeg'),
                import('@ffmpeg/util'),
            ]);
            const ffmpeg = new FFmpeg();
            await ffmpeg.load({
                coreURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            return ffmpeg;
        })();
        ffmpegPromise.catch(() => {
            ffmpegPromise = null;
        });
    }
    return ffmpegPromise;
}

export async function compressVideo(file: File, onProgress?: (ratio: number) => void): Promise<File> {
    if (shouldSkipVideoCompression(file.size)) {
        return file;
    }

    const ffmpeg = await loadFFmpeg();
    const inputName = `input_${Date.now()}${file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? '.mp4'}`;
    const outputName = `output_${Date.now()}.mp4`;

    const progressHandler = ({ progress }: { progress: number }) => {
        if (onProgress) onProgress(Math.max(0, Math.min(1, progress)));
    };
    ffmpeg.on('progress', progressHandler);

    try {
        await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
        await ffmpeg.exec([
            '-i', inputName,
            '-vf', `scale='min(1280,iw)':'min(${VIDEO_MAX_HEIGHT},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', VIDEO_CRF,
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y', outputName,
        ]);

        const data = await ffmpeg.readFile(outputName) as Uint8Array;
        ffmpeg.deleteFile(inputName).catch(() => undefined);
        ffmpeg.deleteFile(outputName).catch(() => undefined);

        if (!data || data.byteLength === 0) {
            return file;
        }

        return new File([data as BlobPart], replaceExtension(file.name, 'mp4'), {
            type: 'video/mp4',
            lastModified: Date.now(),
        });
    } finally {
        ffmpeg.off('progress', progressHandler);
    }
}

export interface PrepareOptions {
    onProgress?: (ratio: number) => void;
    onStage?: (stage: 'compressing' | 'done') => void;
}

export async function prepareForUpload(file: File, options: PrepareOptions = {}): Promise<PreparedMedia> {
    const kind = mediaKindOf(file);
    const originalSize = file.size;

    if (kind === 'raw') {
        return { file, kind, originalSize, finalSize: originalSize, compressed: false };
    }

    try {
        options.onStage?.('compressing');
        const prepared = kind === 'image'
            ? await compressImage(file)
            : await compressVideo(file, options.onProgress);
        options.onStage?.('done');

        const compressed = prepared !== file && prepared.size < originalSize;
        const ratio = originalSize > 0 ? (prepared.size / originalSize) : 1;
        return {
            file: prepared,
            kind,
            originalSize,
            finalSize: prepared.size,
            compressed,
            note: compressed
                ? `${formatBytes(originalSize)} → ${formatBytes(prepared.size)} (${Math.max(1, Math.round((1 - ratio) * 100))}% smaller)`
                : undefined,
        };
    } catch {
        options.onStage?.('done');
        return { file, kind, originalSize, finalSize: originalSize, compressed: false };
    }
}
