import { api } from '@/lib/api';
import { embedUrlFor, isKnownProvider, type VideoProvider } from '@/lib/video';
import { useEffect, useRef, useState } from 'react';

/**
 * First-party player chrome for feed videos.
 *
 * Watch time (view-heartbeat) is only reported from real playback signals:
 *   - upload    -> native <video> play/pause events,
 *   - youtube   -> YouTube IFrame API state changes,
 *   - vimeo     -> Vimeo Player SDK play/pause events,
 *   - facebook  -> SDK-less plugin iframe: playback state is not observable
 *                  from our origin, so NO heartbeat is sent (honest zero
 *                  instead of guessed watch time).
 * A heartbeat chunk is sent every 15 active seconds; the server upserts the
 * per-viewer row, so completion always requires accumulated evidence.
 */
interface PlayerPost {
    id: string;
    media_type?: string | null;
    video_url?: string | null;
    video_provider?: string | null;
    provider_video_id?: string | null;
}

export interface WatchProgress {
    watch_seconds: number;
    completed: boolean;
    views_count: number;
}

interface Props {
    post: PlayerPost;
    /** Muted autoplay once the player is in the viewport (feed default). */
    autoplay?: boolean;
    className?: string;
    onProgress?: (progress: WatchProgress) => void;
}

/* ---------- SDK typings (no `any`: structural interfaces only) ---------- */

interface YTPlayerHandle {
    destroy(): void;
    playVideo(): void;
    pauseVideo(): void;
}
interface YTApi {
    Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayerHandle;
    PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
}
interface VimeoHandle {
    on(event: string, cb: (data: Record<string, unknown>) => void): void;
    play(): Promise<void>;
    pause(): Promise<void>;
    destroy(): void;
}
interface VimeoApi {
    Player: new (el: HTMLElement, opts?: Record<string, unknown>) => VimeoHandle;
}

declare global {
    interface Window {
        YT?: YTApi;
        onYouTubeIframeAPIReady?: () => void;
        Vimeo?: VimeoApi;
    }
}

function loadYouTube(): Promise<YTApi> {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    return new Promise((resolve, reject) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prev?.();
            if (window.YT?.Player) resolve(window.YT);
        };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            script.onerror = () => reject(new Error('YouTube player failed to load'));
            document.head.appendChild(script);
        }
        let tries = 0;
        const timer = window.setInterval(() => {
            if (window.YT?.Player) {
                window.clearInterval(timer);
                resolve(window.YT);
            } else if (++tries > 60) {
                window.clearInterval(timer);
                reject(new Error('YouTube player timed out'));
            }
        }, 250);
    });
}

function loadVimeo(): Promise<VimeoApi> {
    if (window.Vimeo?.Player) return Promise.resolve(window.Vimeo);
    return new Promise((resolve, reject) => {
        if (!document.querySelector('script[src*="player.vimeo.com/api/player.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://player.vimeo.com/api/player.js';
            script.async = true;
            script.onerror = () => reject(new Error('Vimeo player failed to load'));
            document.head.appendChild(script);
        }
        let tries = 0;
        const timer = window.setInterval(() => {
            if (window.Vimeo?.Player) {
                window.clearInterval(timer);
                resolve(window.Vimeo);
            } else if (++tries > 60) {
                window.clearInterval(timer);
                reject(new Error('Vimeo player timed out'));
            }
        }, 250);
    });
}

const CHUNK_SECONDS = 15;

export default function VideoPlayer({ post, autoplay = true, className = '', onProgress }: Props) {
    const mountRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const ytHandleRef = useRef<YTPlayerHandle | null>(null);
    const vimeoHandleRef = useRef<VimeoHandle | null>(null);
    const activeRef = useRef(false);
    const secondsRef = useRef(0);
    const inViewRef = useRef(false);
    const progressCbRef = useRef(onProgress);
    progressCbRef.current = onProgress;

    const [sdkFailed, setSdkFailed] = useState(false);
    const provider: VideoProvider = isKnownProvider(post.video_provider) ? post.video_provider : 'upload';
    const embedId = post.provider_video_id ?? '';

    const setActive = (active: boolean) => {
        activeRef.current = active;
    };

    const flush = () => {
        const chunk = secondsRef.current;
        if (chunk <= 0) return;
        secondsRef.current = 0;
        api.post<{ data: WatchProgress }>(`/api/learn/posts/${post.id}/view-heartbeat`, {
            watch_seconds: Math.min(chunk, 60),
        })
            .then((res) => progressCbRef.current?.(res.data))
            .catch(() => {
                // Guests (401) and network hiccups never interrupt playback.
            });
    };

    /* Accumulator: one heartbeat per 15 active seconds. */
    useEffect(() => {
        const timer = window.setInterval(() => {
            if (!activeRef.current) return;
            secondsRef.current += 1;
            if (secondsRef.current >= CHUNK_SECONDS) flush();
        }, 1000);
        return () => {
            window.clearInterval(timer);
            flush();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post.id]);

    /* Viewport tracking: autoplay in view, pause counting when scrolled away. */
    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries[0]?.isIntersecting ?? false;
                inViewRef.current = visible;
                if (!visible) {
                    setActive(false);
                    videoRef.current?.pause();
                    ytHandleRef.current?.pauseVideo();
                    void vimeoHandleRef.current?.pause().catch(() => undefined);
                } else if (autoplay) {
                    videoRef.current?.play().catch(() => undefined);
                    ytHandleRef.current?.playVideo();
                    void vimeoHandleRef.current?.play().catch(() => undefined);
                }
            },
            { threshold: 0.5 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [autoplay, provider, embedId]);

    /* Provider setup. */
    useEffect(() => {
        if (provider === 'youtube' && mountRef.current && embedId) {
            let cancelled = false;
            loadYouTube()
                .then((YT) => {
                    if (cancelled || !mountRef.current) return;
                    const host = document.createElement('div');
                    mountRef.current.appendChild(host);
                    ytHandleRef.current = new YT.Player(host, {
                        videoId: embedId,
                        playerVars: { rel: 0, playsinline: 1, modestbranding: 1, autoplay: autoplay ? 1 : 0, mute: autoplay ? 1 : 0 },
                        events: {
                            onStateChange: (event: { data: number }) => {
                                if (event.data === YT.PlayerState.PLAYING) setActive(inViewRef.current);
                                else setActive(false);
                            },
                        },
                    });
                })
                .catch(() => setSdkFailed(true));
            return () => {
                cancelled = true;
                ytHandleRef.current?.destroy();
                ytHandleRef.current = null;
            };
        }

        if (provider === 'vimeo' && mountRef.current && embedId) {
            let cancelled = false;
            loadVimeo()
                .then((Vimeo) => {
                    if (cancelled || !mountRef.current) return;
                    const host = document.createElement('div');
                    mountRef.current.appendChild(host);
                    const player = new Vimeo.Player(host, {
                        id: embedId,
                        autoplay,
                        muted: autoplay,
                        playsinline: true,
                    });
                    vimeoHandleRef.current = player;
                    player.on('play', () => setActive(inViewRef.current));
                    player.on('pause', () => setActive(false));
                    player.on('ended', () => setActive(false));
                })
                .catch(() => setSdkFailed(true));
            return () => {
                cancelled = true;
                vimeoHandleRef.current?.destroy();
                vimeoHandleRef.current = null;
            };
        }

        return () => {
            ytHandleRef.current?.destroy();
            ytHandleRef.current = null;
            vimeoHandleRef.current?.destroy();
            vimeoHandleRef.current = null;
        };
    }, [provider, embedId, autoplay]);

    if (provider === 'upload' && post.video_url) {
        return (
            <div className={className}>
                <video
                    ref={videoRef}
                    src={post.video_url}
                    controls
                    playsInline
                    muted={autoplay}
                    className="aspect-video w-full rounded-lg bg-black"
                    onPlay={() => setActive(inViewRef.current)}
                    onPause={() => setActive(false)}
                    onEnded={() => setActive(false)}
                    aria-label="Feed video"
                />
            </div>
        );
    }

    if (provider === 'facebook' && embedId) {
        return (
            <div className={className}>
                <iframe
                    src={embedUrlFor('facebook', embedId) ?? ''}
                    className="aspect-video w-full rounded-lg border-0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="Facebook video"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Watch time for Facebook embeds is not measured (the player runs on facebook.com).
                </p>
            </div>
        );
    }

    if (sdkFailed) {
        // Honest fallback: show the provider page rather than pretend to play.
        const external =
            provider === 'youtube' && embedId
                ? `https://www.youtube.com/watch?v=${embedId}`
                : provider === 'vimeo' && embedId
                  ? `https://vimeo.com/${embedId}`
                  : post.video_url;
        return (
            <div className={className}>
                <a
                    href={external ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                >
                    Play on {provider === 'youtube' ? 'YouTube' : 'Vimeo'} (player unavailable)
                </a>
            </div>
        );
    }

    if (provider === 'youtube' || provider === 'vimeo') {
        return (
            <div className={className}>
                <div ref={mountRef} className="aspect-video w-full overflow-hidden rounded-lg bg-black" />
            </div>
        );
    }

    return null;
}
