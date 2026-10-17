import { describe, expect, it } from 'vitest';
import { embedUrlFor, meetingRoomName, resolvePlaybackSource, resolveVideoUrl } from './video';

describe('resolvePlaybackSource', () => {
    it('resolves youtube watch, short and embed links to the embeddable provider', () => {
        const watch = resolvePlaybackSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(watch).toMatchObject({ provider: 'youtube', videoId: 'dQw4w9WgXcQ', playable: true });
        expect(resolvePlaybackSource('https://youtu.be/dQw4w9WgXcQ')?.provider).toBe('youtube');
        expect(resolvePlaybackSource('https://www.youtube.com/embed/dQw4w9WgXcQ')?.videoId).toBe('dQw4w9WgXcQ');
    });

    it('resolves vimeo, facebook and tiktok links', () => {
        expect(resolvePlaybackSource('https://vimeo.com/123456789')?.provider).toBe('vimeo');
        expect(resolvePlaybackSource('https://www.facebook.com/videos/1234567890/')?.provider).toBe('facebook');
        expect(resolvePlaybackSource('https://www.tiktok.com/@everythingneed/video/7441671234567890123')).toMatchObject({
            provider: 'tiktok',
            videoId: '7441671234567890123',
            playable: true,
        });
    });

    it('plays direct media files natively', () => {
        for (const url of [
            'https://cdn.example.com/lesson.mp4',
            'https://cdn.example.com/clip.webm?token=abc',
            'https://cdn.example.com/live/stream.m3u8',
        ]) {
            expect(resolvePlaybackSource(url)).toMatchObject({ provider: 'file', playable: true });
        }
    });

    it('marks udemy links as non-embeddable notices', () => {
        const source = resolvePlaybackSource('https://www.udemy.com/course/react-the-complete-guide/');
        expect(source).toMatchObject({ provider: 'udemy', playable: false, url: 'https://www.udemy.com/course/react-the-complete-guide/' });
    });

    it('embeds jitsi live-class rooms in-app', () => {
        const source = resolvePlaybackSource('https://meet.jit.si/EverythingNeed-Class-101');
        expect(source).toMatchObject({ provider: 'jitsi', playable: true });
        expect(meetingRoomName('https://meet.jit.si/EverythingNeed-Class-101')).toBe('EverythingNeed-Class-101');
        expect(meetingRoomName('https://meet.jit.si/')).toBe('');
    });

    it('keeps google meet and zoom as labeled external notices', () => {
        expect(resolvePlaybackSource('https://meet.google.com/abc-defg-hij')).toMatchObject({ provider: 'meet', playable: false });
        expect(resolvePlaybackSource('https://us02web.zoom.us/j/1234567890')).toMatchObject({ provider: 'zoom', playable: false });
        expect(resolvePlaybackSource('https://zoom.us/j/1234567890')).toMatchObject({ provider: 'zoom', playable: false });
    });

    it('returns null for unknown hosts and blank input', () => {
        expect(resolvePlaybackSource('https://example.com/watch/1')).toBeNull();
        expect(resolvePlaybackSource('')).toBeNull();
        expect(resolvePlaybackSource(null)).toBeNull();
        expect(resolvePlaybackSource(undefined)).toBeNull();
    });

    it('keeps the feed composer contract: youtube/vimeo/facebook/tiktok/files yes, udemy no', () => {
        expect(resolveVideoUrl('https://cdn.example.com/lesson.mp4')?.provider).toBe('file');
        expect(resolveVideoUrl('https://www.udemy.com/course/x/')).toBeNull();
        expect(resolveVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.provider).toBe('youtube');
        expect(resolveVideoUrl('https://www.tiktok.com/@x/video/7441671234567890123')?.provider).toBe('tiktok');
    });
});

describe('embedUrlFor', () => {
    it('builds provider embed URLs and passes self-hosted urls through', () => {
        expect(embedUrlFor('youtube', 'abc123')).toContain('youtube-nocookie.com/embed/abc123');
        expect(embedUrlFor('vimeo', '123456789')).toContain('player.vimeo.com/video/123456789');
        expect(embedUrlFor('tiktok', '7441671234567890123')).toBe('https://www.tiktok.com/embed/v2/7441671234567890123');
        expect(embedUrlFor('file', 'https://cdn.example.com/a.mp4')).toBe('https://cdn.example.com/a.mp4');
        expect(embedUrlFor('upload', 'https://cdn.example.com/b.mp4')).toBe('https://cdn.example.com/b.mp4');
    });
});
