/**
 * Video source rules for the knowledge feed - client mirror of
 * Modules/Learn/Support/VideoResolver.php.
 *
 * A URL is resolved ONCE at submit time (server stores provider + id);
 * playback always goes through embedUrlFor() so the UI never reflects an
 * arbitrary embed host back from stored data.
 */
export type VideoProvider = 'upload' | 'youtube' | 'vimeo' | 'facebook';

export const VIDEO_PROVIDERS: readonly VideoProvider[] = ['upload', 'youtube', 'vimeo', 'facebook'];

export interface ResolvedVideo {
    provider: VideoProvider;
    videoId: string;
    /** Self-hosted files play their own URL; embeds get a provider embed URL. */
    url: string;
}

function youtubeId(raw: string): string | null {
    let u: URL;
    try {
        u = new URL(raw);
    } catch {
        return null;
    }
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
        const id = u.pathname.slice(1).split('/')[0];
        return /^[\w-]{6,20}$/.test(id) ? id : null;
    }
    if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
        const v = u.searchParams.get('v');
        if (v && /^[\w-]{6,20}$/.test(v)) return v;
        const match = u.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{6,20})/);
        return match ? match[1] : null;
    }
    return null;
}

function vimeoId(raw: string): string | null {
    let u: URL;
    try {
        u = new URL(raw);
    } catch {
        return null;
    }
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
    const match = u.pathname.match(/\/(?:video\/)?(\d{6,12})/);
    return match ? match[1] : null;
}

function facebookId(raw: string): string | null {
    let u: URL;
    try {
        u = new URL(raw);
    } catch {
        return null;
    }
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'fb.watch') {
        const id = u.pathname.slice(1).split('/')[0];
        return /^[\w-]{6,30}$/.test(id) ? id : null;
    }
    if (!['facebook.com', 'm.facebook.com'].includes(host)) return null;
    const match = u.pathname.match(/\/videos\/(?:\w+\/)?(\d{6,20})/);
    return match ? match[1] : null;
}

/** Client-side resolution used by the composer preview (mirrors the server). */
export function resolveVideoUrl(raw: string): ResolvedVideo | null {
    const value = raw.trim();
    if (!/^https?:\/\//i.test(value)) return null;

    if (/\/storage\/uploads\//.test(value)) {
        return { provider: 'upload', videoId: value, url: value };
    }

    const yt = youtubeId(value);
    if (yt) return { provider: 'youtube', videoId: yt, url: value };

    const vim = vimeoId(value);
    if (vim) return { provider: 'vimeo', videoId: vim, url: value };

    const fb = facebookId(value);
    if (fb) return { provider: 'facebook', videoId: fb, url: value };

    return null;
}

/**
 * Embed URL for a resolved pair. Flags are opt-in so a card never
 * auto-plays until the player component asks for it.
 */
export function embedUrlFor(
    provider: VideoProvider,
    videoId: string,
    opts: { autoplay?: boolean } = {},
): string | null {
    const auto = opts.autoplay ? '&autoplay=1&mute=1' : '';
    switch (provider) {
        case 'youtube':
            return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1&playsinline=1${auto}`;
        case 'vimeo':
            return `https://player.vimeo.com/video/${encodeURIComponent(videoId)}?playsinline=1${auto}`;
        case 'facebook': {
            const href = encodeURIComponent(`https://www.facebook.com/videos/${videoId}/`);
            return `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=640`;
        }
        case 'upload':
            return videoId;
        default:
            return null;
    }
}

/** True when a stored pair from the API is safe to render. */
export function isKnownProvider(value: string | null | undefined): value is VideoProvider {
    return typeof value === 'string' && (VIDEO_PROVIDERS as readonly string[]).includes(value);
}
