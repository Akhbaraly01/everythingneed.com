import { describe, expect, it, vi } from 'vitest';
import {
    formatBytes,
    mediaKindFor,
    mediaKindOf,
    prepareForUpload,
    shouldSkipImageCompression,
    shouldSkipVideoCompression,
} from '@/lib/media-compress';

function fileOf(size: number, name: string, type: string): File {
    return new File([new Uint8Array(size)], name, { type });
}

describe('formatBytes', () => {
    it('formats each magnitude', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(512)).toBe('512 B');
        expect(formatBytes(2048)).toBe('2 KB');
        expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
        expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.50 GB');
    });

    it('defends against non-finite values', () => {
        expect(formatBytes(Number.NaN)).toBe('0 B');
        expect(formatBytes(-4)).toBe('0 B');
    });
});

describe('media kind detection', () => {
    it('maps mime prefixes', () => {
        expect(mediaKindFor('image/png')).toBe('image');
        expect(mediaKindFor('video/quicktime')).toBe('video');
        expect(mediaKindFor('application/pdf')).toBe('raw');
    });

    it('passes animated/vector images through untouched', () => {
        expect(mediaKindOf(fileOf(10, 'a.gif', 'image/gif'))).toBe('raw');
        expect(mediaKindOf(fileOf(10, 'a.svg', 'image/svg+xml'))).toBe('raw');
        expect(mediaKindOf(fileOf(10, 'a.png', 'image/png'))).toBe('image');
    });
});

describe('compression thresholds', () => {
    it('skips images under 200KB', () => {
        expect(shouldSkipImageCompression(100 * 1024)).toBe(true);
    });

    it('skips already-web-sized images up to 800KB', () => {
        expect(shouldSkipImageCompression(500 * 1024, 1000, 800)).toBe(true);
        expect(shouldSkipImageCompression(900 * 1024, 1000, 800)).toBe(false);
    });

    it('compresses oversized dimensions regardless of size', () => {
        expect(shouldSkipImageCompression(300 * 1024, 4000, 3000)).toBe(false);
    });

    it('skips videos up to 12MB like WhatsApp', () => {
        expect(shouldSkipVideoCompression(12 * 1024 * 1024)).toBe(true);
        expect(shouldSkipVideoCompression(12 * 1024 * 1024 + 1)).toBe(false);
    });
});

describe('prepareForUpload', () => {
    it('passes raw documents straight through without stage callbacks', async () => {
        const pdf = fileOf(2048, 'doc.pdf', 'application/pdf');
        const onStage = vi.fn();
        const result = await prepareForUpload(pdf, { onStage });
        expect(result.file).toBe(pdf);
        expect(result.kind).toBe('raw');
        expect(result.compressed).toBe(false);
        expect(result.finalSize).toBe(2048);
        expect(onStage).not.toHaveBeenCalled();
    });

    it('returns small videos untouched without booting ffmpeg', async () => {
        const clip = fileOf(1024, 'clip.mp4', 'video/mp4');
        const result = await prepareForUpload(clip);
        expect(result.file).toBe(clip);
        expect(result.kind).toBe('video');
        expect(result.compressed).toBe(false);
    });

    it('degrades gracefully when the image pipeline fails', async () => {
        // jsdom cannot decode images; the original file must survive.
        const photo = fileOf(3 * 1024 * 1024, 'photo.jpg', 'image/jpeg');
        const onStage = vi.fn();
        const result = await prepareForUpload(photo, { onStage });
        expect(result.file).toBe(photo);
        expect(result.kind).toBe('image');
        expect(result.compressed).toBe(false);
        expect(result.note).toBeUndefined();
        expect(onStage).toHaveBeenCalledWith('compressing');
        expect(onStage).toHaveBeenCalledWith('done');
    });
});
